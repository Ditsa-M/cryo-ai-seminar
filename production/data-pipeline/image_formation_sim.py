"""Deterministic SIMULATION of single-particle image formation from a deposited atomic model
(beta-galactosidase, PDB 6CVM -> ChimeraX molmap 4 A, 2 A/px). No experimental pixels.

  y_i = CTF_i * P(R_i) V + noise
Outputs (npz): clean projections, CTF-modulated projections, noisy images, the CTF curve,
averages of N aligned noisy images, and central slices of 3D reconstructions from N random
views with KNOWN poses (direct Fourier insertion) -- i.e. what alignment would deliver if perfect.

Usage: python image_formation_sim.py MAP.mrc OUT.npz [--seed 561]
"""
import sys, numpy as np, mrcfile, torch
import torch.nn.functional as F

mapf, out = sys.argv[1:3]
SEED = 561
g = torch.Generator().manual_seed(SEED)
dev = "cuda" if torch.cuda.is_available() else "cpu"
m = mrcfile.open(mapf, permissive=True); apix = float(m.voxel_size.x)
v = torch.tensor(m.data.astype(np.float32))
# pad to cube of 128
N = 128
pad = [(N - s) // 2 for s in v.shape]
V = torch.zeros(N, N, N); V[pad[0]:pad[0]+v.shape[0], pad[1]:pad[1]+v.shape[1], pad[2]:pad[2]+v.shape[2]] = v
V = (V / V.max()).to(dev)

def rand_rot(n):
    q = torch.randn(n, 4, generator=g); q = q / q.norm(dim=1, keepdim=True)
    w, x, y, z = q.T
    R = torch.stack([1-2*(y*y+z*z), 2*(x*y-z*w), 2*(x*z+y*w),
                     2*(x*y+z*w), 1-2*(x*x+z*z), 2*(y*z-x*w),
                     2*(x*z-y*w), 2*(y*z+x*w), 1-2*(x*x+y*y)], 1).reshape(n, 3, 3)
    return R.to(dev)

def project(R, chunk=8):
    out = []
    for i in range(0, len(R), chunk):
        r = R[i:i+chunk]
        A = torch.zeros(len(r), 3, 4, device=dev); A[:, :, :3] = r
        grid = F.affine_grid(A, (len(r), 1, N, N, N), align_corners=False)
        vol = F.grid_sample(V[None, None].expand(len(r), 1, N, N, N), grid, align_corners=False)
        out.append(vol[:, 0].sum(1))  # project along z
    return torch.cat(out)

# CTF (300 kV, Cs 2.7 mm, 7% amplitude contrast, 1.5 um defocus) -- stated parameters
lam = 0.0197; Cs = 2.7e7; ac = 0.07; df = 15000.0
fr = torch.fft.fftfreq(N, d=apix, device=dev)
ky, kx = torch.meshgrid(fr, fr, indexing="ij"); k2 = kx**2 + ky**2
def ctf(defocus):
    chi = np.pi * lam * defocus * k2 - 0.5 * np.pi * Cs * lam**3 * k2**2
    return -(np.sqrt(1 - ac**2) * torch.sin(chi) + ac * torch.cos(chi))
C = ctf(df)
k1 = np.linspace(0, 1 / (2 * apix), 400)
chi1 = np.pi * lam * df * k1**2 - 0.5 * np.pi * Cs * lam**3 * k1**4
ctf1d = -(np.sqrt(1 - ac**2) * np.sin(chi1) + ac * np.cos(chi1))

def apply_ctf(p, c): return torch.fft.ifft2(torch.fft.fft2(p) * c).real
def add_noise(p, snr):
    sig = p.std(dim=(1, 2), keepdim=True)
    return p + torch.randn(p.shape, generator=g).to(dev) * sig / np.sqrt(snr)

SNR = 0.05
# six example views
R6 = rand_rot(6)
clean = project(R6); ctfd = apply_ctf(clean, C); noisy = add_noise(ctfd, SNR)

# averaging the SAME view: SNR grows ~N
R1 = R6[:1].expand(1000, 3, 3)
p1 = apply_ctf(project(R6[:1]), C).expand(1000, N, N)
n1 = add_noise(p1.clone(), SNR)
avgs = {n: n1[:n].mean(0).cpu().numpy() for n in (1, 10, 100, 1000)}

# 3D reconstruction with known poses: direct Fourier insertion (nearest neighbour, CTF-weighted, Wiener)
def reconstruct(nviews, batch=200):
    num = torch.zeros(N, N, N, dtype=torch.complex64, device=dev); den = torch.zeros(N, N, N, device=dev)
    fi = torch.fft.fftfreq(N, device=dev) * N
    yy, xx = torch.meshgrid(fi, fi, indexing="ij")
    done = 0
    while done < nviews:
        b = min(batch, nviews - done); R = rand_rot(b)
        dfs = df + (torch.rand(b, generator=g).to(dev) - 0.5) * 10000   # 1.0-2.0 um defocus spread
        imgs = []
        cs = torch.stack([ctf(float(d)) for d in dfs])
        imgs = add_noise(apply_ctf(project(R), cs), SNR)
        Fimg = torch.fft.fft2(torch.fft.ifftshift(imgs, dim=(1, 2)))
        # central-slice theorem: image FT = Vhat on the plane R*(kx,ky,0) (affine_grid samples V at R*o)
        pts = torch.stack([xx, yy, torch.zeros_like(xx)], -1).reshape(-1, 3)        # (N*N, 3) in (x,y,z)
        P = torch.einsum("bij,nj->bni", R, pts)   # FT of V(R o) is Vhat(R k): plane rotated by R
        # map (x,y,z) -> array index (z,y,x)
        iz = torch.round(P[..., 2]).long() % N; iy = torch.round(P[..., 1]).long() % N; ix = torch.round(P[..., 0]).long() % N
        lin = (iz * N + iy) * N + ix
        cw = cs.reshape(b, -1)
        num.view(-1).index_add_(0, lin.flatten(), (Fimg.reshape(b, -1) * cw).flatten())
        den.view(-1).index_add_(0, lin.flatten(), (cw**2).flatten())
        done += b
    vol = torch.fft.fftshift(torch.fft.ifftn(num / (den + 1.0 / SNR * 0.05))).real
    return vol

recs = {}
for n in (30, 300, 3000, 30000):
    r = reconstruct(n)
    recs[n] = r[N // 2].cpu().numpy()     # central z-slice
    if n == 30000:
        with mrcfile.new(out.replace(".npz", f"_rec{n}.mrc"), overwrite=True) as mm:
            mm.set_data(r.cpu().numpy().astype(np.float32)); mm.voxel_size = apix
truth_slice = V[N // 2].cpu().numpy()

np.savez_compressed(out, seed=SEED, apix=apix, snr=SNR, defocus_A=df, kv=300, cs_mm=2.7, amp_contrast=ac,
    clean=clean.cpu().numpy(), ctfd=ctfd.cpu().numpy(), noisy=noisy.cpu().numpy(),
    ctf2d=torch.fft.fftshift(C).cpu().numpy(), ctf_k=k1, ctf_1d=ctf1d,
    avg_n=np.array(list(avgs.keys())), avgs=np.array(list(avgs.values())),
    rec_n=np.array(list(recs.keys())), rec_slices=np.array(list(recs.values())), truth_slice=truth_slice)
print("ok", {k: float(np.corrcoef(v.ravel(), truth_slice.ravel())[0, 1]) for k, v in recs.items()})

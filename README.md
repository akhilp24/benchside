# Benchside

Downloads and installation instructions for **Benchside**, nanopore telomere tools (basecalling with Dorado, POD5 telomere extraction).

**Download page:** see the link in this repository's description.

This repository holds only:

- the **releases**: the Windows and Mac installers, built automatically from the app's (private) source repository when a new version is tagged, and
- the **download page** (`index.html`, `style.css`, `app.js`), deployed on Vercel. It reads the releases from GitHub, so publishing a release updates the page without a redeploy.

New versions arrive here as draft releases. A draft is tested on a lab computer, then published:

```bash
gh release edit v0.2.0 --repo akhilp24/benchside --draft=false --latest
```

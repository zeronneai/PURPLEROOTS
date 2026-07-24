# Case Studies — media drop

Each case study loads its videos + poster stills from this folder, by convention:

    assets/case-studies/{id}/{n}.mp4     ← video
    assets/case-studies/{id}/{n}.jpg     ← matching poster still (same {n})

Posters are always shown until a video is in view and starts playing. If a
video (or its poster) is missing, the player degrades gracefully to the poster
/ a neutral play affordance — it never leaves a black box.

Drop these exact files in:

## 01 — Mark Davis  (2 videos, horizontal 16:9)
    assets/case-studies/01/1.mp4   assets/case-studies/01/1.jpg
    assets/case-studies/01/2.mp4   assets/case-studies/01/2.jpg

## 02 — Chingón Cuh'ts  (1 video, vertical 9:16)
    assets/case-studies/02/1.mp4   assets/case-studies/02/1.jpg

## 03 — Mario Yague / El Toro Law  (4 videos, horizontal 16:9)
    assets/case-studies/03/1.mp4   assets/case-studies/03/1.jpg
    assets/case-studies/03/2.mp4   assets/case-studies/03/2.jpg
    assets/case-studies/03/3.mp4   assets/case-studies/03/3.jpg
    assets/case-studies/03/4.mp4   assets/case-studies/03/4.jpg

## 04 — Powerhouse Gym El Paso  (1 video, vertical 9:16)
    assets/case-studies/04/1.mp4   assets/case-studies/04/1.jpg

## Encoding tips
- MP4 (H.264 / AAC or no audio), web-optimized (faststart).
- Muted autoplay-in-view; provide a poster JPG the same aspect as the video.
- Horizontal = 16:9, Vertical = 9:16. Keep files reasonably small (<15 MB ideal).

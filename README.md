# Akila Eyewear

This repository contains the backend and frontend code for the Akila Eyewear e-commerce platform, featuring a complete administrative dashboard and an experimental 3D Virtual Try-On experience.

## 🔑 Demo Account

If you are exploring the live site, you can view the storefront and the full admin panel using these seeded credentials:

- **Email**: `admin@akila.com`
- **Password**: `Admin@12345`

Log in at `/admin/login` on the live site to explore the admin dashboard, KPIs, and manipulate Virtual Try-On configuration pages.

## Tech Stack

**Frontend:**
- **Framework & Language:** Next.js 16 (App Router), TypeScript
- **Styling & UI:** Tailwind CSS, Framer Motion
- **State Management:** Zustand, React Query
- **3D & AR:** Three.js, React Three Fiber, MediaPipe Tasks Vision (Face Landmarker)

**Backend:**
- **Framework:** Django 6, Django REST Framework
- **Authentication:** SimpleJWT (JSON Web Tokens)
- **Database:** SQLite (Local) / PostgreSQL (via Neon.tech for Production)
- **Hosting:** Render (Backend), Vercel (Frontend)

## 🕶️ Virtual Try-On Experience

### Overview
The Virtual Try-On (VTO) leverages Google's **MediaPipe Face Landmarker** to track facial features via your webcam in real-time. It then uses **Three.js** to dynamically scale, rotate, and position `.glb` 3D glasses models over your face. 

### Implementation Details:
The frontend captures a live video feed, passes it to the MediaPipe engine, and calculates metrics like eye distance, temple width, and face depth. It then intelligently anchors the glasses using a combination of the nose bridge and eye centers while predicting yaw, pitch, and roll to map the 3D space realistically onto your movement.

> [!WARNING]
> **Disclaimer on 3D Models:** The glasses models (`.glb` files) currently used in this repository are **free, pre-made assets** downloaded from the internet. Because they aren't uniquely tailored to the proportions of this specific face-tracking math, they may not fit the bridge of your nose or perfectly rest behind your ears as expected. 
> 
> To achieve a truly photorealistic, perfect fit, raw custom 3D models specifically rigged for AR facial anchors need to be created. That step has not been completed for this demo application.

---
*For extensive development setup, offline standardization scripts, and granular VTO pipeline documentation, please read `frontend/README.md`.*

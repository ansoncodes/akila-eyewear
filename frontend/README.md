# Akila Frontend

Next.js App Router + TypeScript frontend for Akila eyewear ecommerce.

## Stack
- Next.js 16 App Router
- TypeScript
- Tailwind CSS
- React Query
- Axios with JWT refresh
- Zustand
- Three.js + GLTFLoader
- MediaPipe Tasks Vision
- Recharts

## Demo Account

You can test the storefront and the full admin panel using the seeded sample account:
- **Email**: `admin@akila.com`
- **Password**: `Admin@12345`

Log in at `/admin/login` or via the standard user login page.

## Setup
1. Install dependencies

```bash
npm install
```

2. Configure env

```bash
cp .env.example .env.local
```

3. Add GLB files in `public/models/`
- `blue_rectangle_glasses.glb`
- `green_round_sunglasses.glb`
- `ray-ban_glasses.glb`
- `reading_glasses.glb`
- `thug_life_glasses.glb`

4. Run app

```bash
npm run dev
```

5. Verify build

```bash
npm run lint
npm run build
```

## Environment Variables
- `NEXT_PUBLIC_API_BASE_URL` example `http://127.0.0.1:8000/api`
- `NEXT_PUBLIC_DJANGO_BASE_URL` example `http://127.0.0.1:8000`
- `NEXT_PUBLIC_AI_CALIBRATOR_URL` optional display/config status in admin settings

## Virtual Try-On Internals

This section documents the current try-on pipeline used in:

- `src/components/try-on/virtual-try-on.tsx`
- `scripts/normalize-glb-pivots.mjs`

### GLB normalization (offline)

Run:

```bash
npm run normalize:pivots
```

Script behavior for each `public/models/*.glb`:

1. Removes existing top-level `__pivot__` nodes (if present) to avoid nested pivot stacking.
2. Computes scene bounds and center.
3. Creates a new top-level pivot node named `__pivot__`.
4. Reparents all scene children under that pivot.
5. Re-centers model at origin with nose-bridge lift:
   - `x = -centerX`
   - `y = -centerY + sizeY * 0.14`
   - `z = -centerZ`
6. Uniform-scales pivot so model width (`sizeX`) targets `0.3` world units.
7. Emits warnings when width is not dominant axis or depth is almost equal to width.

Key constants:

- `TARGET_WIDTH = 0.3`
- `WIDTH_TOLERANCE = 0.01`
- `NOSE_BRIDGE_LIFT = 0.14`

### Runtime model normalization (safety layer)

Even after offline normalization, the runtime loader normalizes again to keep assets consistent:

1. Builds bounding box from loaded GLB scene.
2. Re-centers model root to bounds center.
3. Applies `+size.y * 0.14` vertical lift.
4. Scales model to target width (`FIT.modelTargetWidth = 0.3`).

This protects against missed normalization in newly added model files.

### Face tracking engine

Face tracking uses MediaPipe Tasks Vision `FaceLandmarker` in VIDEO mode with:

- `numFaces: 1`
- `minFaceDetectionConfidence: 0.6`
- `minFacePresenceConfidence: 0.6`
- `minTrackingConfidence: 0.6`

Camera stream target:

- User-facing camera
- Ideal `1280x720`

### Landmarks and metrics used

Landmark indices used in fitting:

- Eyes: `33`, `263`
- Nose bridge and tip: `168`, `1`
- Temples: `234`, `454`
- Face side points: `127`, `356`
- Cheeks: `93`, `323`
- Forehead/chin: `10`, `152`

Per-frame measurements:

- `eyeDistance`
- `templeDistance`
- `sideDistance`
- `cheekDistance`
- `faceHeightDistance`

Frames are rejected/frozen when:

- Any required landmark is missing
- Any metric is invalid or outside guard ranges
- Left temple appears to the right of right temple (invalid geometry)
- Sudden jumps are detected (distance jump, yaw jump, roll jump)

### Pose estimation

The try-on pose is computed from blended signals:

- `rollRaw = atan2(eyeDy, eyeDx)`
- `yawRaw` from weighted combination of:
  - nose horizontal offset from eye center
  - eye depth difference
  - temple depth difference
- `pitchRaw` from weighted combination of:
  - nose vertical offset from eye center
  - nose depth offset from eye center

### Smoothing and stability controls

The pipeline smooths both measurements and transforms:

- Measurement smoothing for distances
- Pose smoothing (`x`, `y`, `depth`, `yaw`, `pitch`, `roll`)
- Transform smoothing:
  - position lerp
  - quaternion slerp
  - scale lerp

Stability controls:

- A short hold window (`confidenceHoldFrames`) freezes updates after unstable frames.
- Landmarks can be missing for up to `lostTrackingFrames`; beyond that the glasses/occluder are hidden and state resets.
- Baseline temple width updates only when face is near frontal (small yaw and roll).

### Scale/depth/placement logic

Glasses size is dynamic and based on tracked face geometry, not static scale only.

Scale combines:

- Baseline temple distance
- Current compensated face width
- Yaw compensation (`1 / cos(|yaw|)`, clamped)
- Distance ratio multiplier
- Face coverage boost
- Model wrap compensation from model width/depth ratio
- Optional manual calibration scale (when calibration source is manual)

Depth combines:

- Base depth (`FIT.baseDepth`)
- Optional manual Z calibration
- Yaw tuck depth correction
- Face-size-based depth compensation

Anchor placement:

- Uses weighted eye center + temple center + nose bridge.
- Converts normalized video coordinates to NDC with aspect-aware letterboxing compensation.
- Unprojects to world space and places model at computed depth plane.

### Calibration usage rules

Backend `GlassesModel` calibration values are source-aware:

- Manual source:
  - manual `scale`, `position_y`, `position_z` are applied (clamped)
  - manual rotations are applied (clamped)
- Non-manual source:
  - uses conservative defaults for scale and Y/Z offsets
- `position_x` is clamped and applied in both cases

### Occlusion model

A depth-only spherical occluder is used for realism:

- Color write disabled, depth write enabled.
- Scale and position are driven by tracked face width/height/depth estimates.
- Occluder follows the same smoothed pose transform as glasses.

This allows parts of the frame to be naturally hidden by facial geometry.

### Debug overlay metrics

Try-on debug mode can be toggled in UI and currently shows:

- tracking state (`tracking` or `frozen`)
- hold frames
- temple distance
- baseline temple distance
- scale ratio
- resolved scale
- yaw

## Routes

### Storefront
- `/`
- `/shop`
- `/product/[id]`
- `/try-on/[id]`
- `/cart`
- `/wishlist`
- `/checkout`
- `/orders`
- `/orders/[id]`
- `/notifications`
- `/login`
- `/register`
- `/profile`

### Admin
- `/admin/login`
- `/admin`
- `/admin/products`
- `/admin/catalog`
- `/admin/calibration`
- `/admin/orders`
- `/admin/orders/[id]`
- `/admin/customers`
- `/admin/customers/[id]`
- `/admin/reviews`
- `/admin/notifications`
- `/admin/settings`
- `/admin/profile`

## Project Structure
```text
src/
  app/
    admin/
      calibration/
      catalog/
      customers/
        [id]/
      login/
      notifications/
      orders/
        [id]/
      products/
      profile/
      reviews/
      settings/
    cart/
    checkout/
    login/
    notifications/
    orders/
      [id]/
    product/
      [id]/
    profile/
    register/
    shop/
    try-on/
      [id]/
    wishlist/
  components/
    admin/
    layout/
    products/
    try-on/
    ui/
  hooks/
  lib/
    admin/
    api/
      admin/
  providers/
  store/
  types/
```

## Admin Features
- Admin-only JWT route access
- KPI dashboard + charts (sales trend, order distribution, top products)
- Product CRUD with category/collection/shape/material/gender/price/active
- Product image management (multiple images)
- 3D model management and calibration values
- AI calibration trigger (single + bulk)
- Orders table filters + status update + order detail
- Payments records and detail modal
- Customers list/detail with spend and history
- Reviews moderation list/detail/delete
- Notifications list + send/broadcast + read/delete
- Settings/integrations status panel and admin profile scaffolds

## Seeded Demo Screenshots Placeholder
- `docs/screenshots/admin-dashboard.png`
- `docs/screenshots/admin-products.png`
- `docs/screenshots/admin-calibration.png`
- `docs/screenshots/admin-orders.png`
- `docs/screenshots/admin-customers.png`
- `docs/screenshots/admin-reviews.png`
- `docs/screenshots/admin-notifications.png`
- `docs/screenshots/admin-settings.png`

## Testing Checklist
1. Login with admin credentials at `/admin/login`.
2. Verify non-admin user is redirected away from admin routes.
3. Open `/admin` and check KPI cards and charts render.
4. Create, edit, activate/deactivate, and delete a product.
5. Upload multiple images to a product.
6. Add or edit a product GLB model calibration values.
7. Run single and bulk AI calibration in `/admin/calibration`.
8. Open preview link from calibration table to `/try-on/[id]`.
9. Filter orders by status/date/payment and update order status.
10. Open order detail page and verify items/shipping/payment sections.
11. Open payment detail modal from payments table.
12. Search customers and open customer detail history sections.
13. Filter reviews and delete a review.
14. Send a broadcast notification and verify list updates.
15. Confirm settings page shows API base URL and AI calibrator status.

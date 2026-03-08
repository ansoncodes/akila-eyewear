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

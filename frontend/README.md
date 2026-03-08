# Akila Frontend

Next.js App Router + TypeScript frontend for the Akila eyewear ecommerce backend.

## Tech
- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS
- React Query
- Axios
- Zustand
- Three.js + GLTFLoader
- MediaPipe Face Mesh
- react-hot-toast

## Setup
1. Install dependencies

```bash
npm install
```

2. Configure environment

```bash
cp .env.example .env.local
```

3. Add 3D model files to `public/models/`
- `blue_rectangle_glasses.glb`
- `green_round_sunglasses.glb`
- `ray-ban_glasses.glb`
- `reading_glasses.glb`
- `thug_life_glasses.glb`

4. Run dev server

```bash
npm run dev
```

Frontend: `http://localhost:3000`

## Environment Variables
- `NEXT_PUBLIC_API_BASE_URL` (example `http://127.0.0.1:8000/api`)
- `NEXT_PUBLIC_DJANGO_BASE_URL` (example `http://127.0.0.1:8000`)

## Routes
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

## Project Structure
```text
src/
  app/
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
    layout/
    products/
    try-on/
    ui/
  hooks/
  lib/
    api/
  providers/
  store/
  types/
```

## Features Implemented
- JWT login/register/profile bootstrap
- Product listing with filters
- Product detail page with gallery + 3D model rotation
- Virtual try-on with webcam + face landmark tracking + backend calibration
- Cart add/update/remove flow
- Wishlist add/remove flow
- Checkout and order creation from cart
- Payment trigger flow
- Orders list/detail
- Reviews list/create/delete-own
- Notifications list/read/read-all
- Responsive UI with loading and empty states

## Testing Checklist
1. Register a customer and login.
2. Browse `/shop` and apply filters.
3. Open `/product/:id`, verify images and 3D viewer rotation.
4. Click `Try On Live`, allow camera, verify model tracks face.
5. Add product to cart and wishlist.
6. Open `/cart`, update quantity, remove item.
7. Open `/checkout`, create order with shipping address.
8. Pay from checkout or `/orders/:id`.
9. Confirm notifications appear and can be marked read.
10. Create and delete own review on product detail.
11. Verify mobile layout for `/shop`, `/product/:id`, `/try-on/:id`, `/cart`.

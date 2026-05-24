# Deployment Guide — Artisanal Henna

This guide walks you through deploying the Artisanal Henna store to Vercel with MongoDB Atlas, Cloudinary, and Stripe.

---

## Prerequisites

- Node.js 20+ installed locally
- A GitHub account (to connect to Vercel)
- A Vercel account (free tier is fine)
- A MongoDB Atlas account (free M0 cluster is fine)
- A Cloudinary account (free plan is fine)
- A Stripe account (test mode keys are sufficient)

---

## 1. MongoDB Atlas Setup

### 1a. Create a Cluster
1. Log in to [MongoDB Atlas](https://cloud.mongodb.com).
2. Click **Create a New Project**, name it `artisanal-henna`.
3. Click **Build a Database** → choose **M0 Free Tier** → select a region close to your users (e.g., Mumbai `ap-south-1`).
4. Click **Create Deployment**.

### 1b. Create a Database User
1. In the left sidebar, go to **Database Access** → **Add New Database User**.
2. Choose **Password** authentication.
3. Set username: `henna-app` and generate a strong password (copy it — you'll need it).
4. Under **Built-in Role**, choose **Read and Write to Any Database**.
5. Click **Add User**.

### 1c. Whitelist IP Addresses
1. In the left sidebar, go to **Network Access** → **Add IP Address**.
2. Click **Allow Access from Anywhere** → enter `0.0.0.0/0`.
   > ⚠️ This is required for Vercel's dynamic build and function IPs. It is safe because your Atlas user has a strong password.
3. Click **Confirm**.

### 1d. Get the Connection String
1. Go to **Database** → click **Connect** → **Drivers**.
2. Select **Node.js** and copy the connection string. It looks like:
   ```
   mongodb+srv://henna-app:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
3. Replace `<password>` with your actual password and append the database name:
   ```
   mongodb+srv://henna-app:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/artisanal-henna?retryWrites=true&w=majority
   ```

---

## 2. Cloudinary Setup

1. Log in to [Cloudinary](https://cloudinary.com).
2. Go to **Settings** → **API Keys** → **Add API Key**.
3. Note your **Cloud Name**, **API Key**, and **API Secret**.
4. (Optional) Create an Upload Preset named `artisanal-henna` under **Settings → Upload** for easier management.

---

## 3. Stripe Setup

### 3a. Get API Keys
1. Log in to [Stripe Dashboard](https://dashboard.stripe.com).
2. Toggle to **Test Mode** (top right).
3. Go to **Developers → API Keys**.
4. Copy your **Publishable Key** (`pk_test_...`) and **Secret Key** (`sk_test_...`).

### 3b. Create a Webhook Endpoint
1. Go to **Developers → Webhooks → Add Endpoint**.
2. For the URL, enter your Vercel deployment URL:
   ```
   https://your-app.vercel.app/api/webhooks/stripe
   ```
3. Under **Events to listen to**, add:
   - `checkout.session.completed`
4. Click **Add Endpoint** and copy the **Signing Secret** (`whsec_...`).

### 3c. Test Locally with Stripe CLI
Install the [Stripe CLI](https://stripe.com/docs/stripe-cli) and run:
```bash
stripe login
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```
Copy the webhook signing secret it prints (starts with `whsec_`) into your `.env.local`.

---

## 4. Environment Variables

Create (or update) `.env.local` at the project root with all required values:

```env
# MongoDB
MONGODB_URI=mongodb+srv://henna-app:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/artisanal-henna?retryWrites=true&w=majority

# Stripe
STRIPE_SECRET_KEY=YOUR_STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET=YOUR_STRIPE_WEBHOOK_SECRET
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=YOUR_STRIPE_PUBLISHABLE_KEY

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# App
NEXT_PUBLIC_SITE_URL=https://your-app.vercel.app

# Admin Auth (any long random string — used for HMAC signing)
ADMIN_JWT_SECRET=your_super_long_random_secret_at_least_32_chars
```

---

## 5. Vercel Deployment

### 5a. Push to GitHub
```bash
git init          # if not already a repo
git add .
git commit -m "chore: production-ready artisanal henna store"
git remote add origin https://github.com/YOUR_USERNAME/artisanal-henna.git
git push -u origin main
```

### 5b. Import Project on Vercel
1. Log in to [Vercel](https://vercel.com).
2. Click **Add New → Project** → import your GitHub repository.
3. Set **Framework Preset** to **Next.js** (auto-detected).
4. Click **Environment Variables** and add **all** the variables from step 4 above.
   > ✅ Make sure `NEXT_PUBLIC_SITE_URL` matches the Vercel URL Vercel assigns (you may need to deploy once first, then update this variable and redeploy).
5. Click **Deploy**.

### 5c. Update Stripe Webhook URL
After your first Vercel deployment, copy your production URL (e.g., `https://artisanal-henna.vercel.app`) and update your Stripe webhook endpoint URL in the Stripe Dashboard.

---

## 6. Running the Seed Script

After deployment, seed the database with sample products and the default admin user.

**Locally against Atlas** (recommended):
```bash
# Make sure your .env.local is configured with the Atlas MONGODB_URI
npx tsx src/lib/seed.ts
```

This will:
- Clear and re-insert 8 sample henna products
- Create the default admin user: `admin@henna.com` / `admin123`

> ⚠️ Change the admin password after first login via MongoDB Atlas directly (see step 7).

---

## 7. Creating / Updating the Admin User in MongoDB

If you need to create a new admin user manually (or reset a password):

### Option A — Via MongoDB Atlas UI
1. Go to Atlas → **Browse Collections** → `artisanal-henna` → `users`.
2. To update the password, click the document → edit the `password` field.
   > ⚠️ The password **must be bcrypt-hashed**. Never store plaintext.

### Option B — Via mongosh or MongoDB Compass
```javascript
// Connect to your cluster, then:
use artisanal-henna

const bcrypt = require('bcryptjs');
const hash = bcrypt.hashSync('your-new-password', 12);

db.users.updateOne(
  { email: 'admin@henna.com' },
  { $set: { password: hash } }
);
```

### Option C — Re-run the seed script
Edit `src/lib/seed.ts`, change the `password` field to your desired plaintext password (it will be hashed automatically), then re-run:
```bash
npx tsx src/lib/seed.ts
```
> ⚠️ This **wipes and re-seeds all products** as well. Only use this in early setup.

---

## 8. Post-Deployment Checklist

- [ ] Visit `/sitemap.xml` — confirm all product pages are listed
- [ ] Visit `/robots.txt` — confirm `/admin` and `/api` are disallowed
- [ ] Log in to `/admin` with `admin@henna.com` / `admin123` — change the password immediately
- [ ] Upload a test product image via `/admin/products/new`
- [ ] Place a test order using Stripe test card `4242 4242 4242 4242`
- [ ] Confirm the order appears in `/admin/orders`
- [ ] Verify the Stripe webhook received `checkout.session.completed` in the Stripe Dashboard

---

## 9. Useful Commands

```bash
# Local development
npm run dev

# Seed the database
npx tsx src/lib/seed.ts

# Build and check for errors
npm run build

# Stripe CLI webhook forwarding (local testing)
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

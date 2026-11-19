# DEXAsync

Aplikasi absensi WFH dan monitoring karyawan. Backend pakai NestJS microservices + Prisma (MySQL), frontend pakai React + Vite dengan satu app yang tampilannya menyesuaikan role (`HRD_ADMIN` dan `EMPLOYEE`).

## Sebelum mulai

Pastikan di laptop sudah terpasang Node.js 20+ dan MySQL sudah jalan di port `3306` (lewat `brew services start mysql`, XAMPP, Laragon, atau service MySQL lokal lainnya).

## Baru clone repo

1. Install semua dependency (root, backend, sama frontend):

```bash
npm run install:all
```

2. Copy file env contoh ke `.env`:

```bash
cp backend/.env.example backend/.env
cp frontend/attendance-app/.env.example frontend/attendance-app/.env
```

Cek `DATABASE_URL` di `backend/.env`, sesuaikan user dan password MySQL lokal kalau beda dari default ini:

```env
DATABASE_URL="mysql://root:@localhost:3306/wfh_attendance_db"
```

3. Generate Prisma client, jalanin migrasi, lalu isi data awal ke database:

```bash
npm run db:setup
```

Kalau mau jalanin satu-satu juga bisa (`npm run prisma:generate`, `npm run prisma:migrate`, terus `npm run db:seed`). Dari dalam folder `backend/`, perintah `npx prisma db seed` juga langsung jalan.

4. Jalanin backend dan frontend barengan:

```bash
npm run dev
```

## Habis git pull

Kalau sebelumnya sudah pernah setup dan baru narik update terbaru dari repo:

```bash
npm run install:all
npm run prisma:generate && npm run prisma:migrate
```

Kalau mau reset database ke akun demo terbaru, jalanin seed lagi:

```bash
npm run db:seed
```

Perlu diingat, `db:seed` bakal hapus semua data absensi, karyawan, dan user yang ada terus bikin ulang akun demo dari nol. Skip aja langkah seed ini kalau data lokal masih mau disimpan.

Habis itu tinggal jalanin lagi:

```bash
npm run dev
```

## Akses lokal

- Frontend: http://localhost:5173
- API Gateway: http://localhost:3000/api
- Swagger Docs: http://localhost:3000/api/docs
- Prisma Studio: jalanin `npm run prisma:studio`, nanti kebuka di http://localhost:5555

## Akun demo

Bawaan dari `npm run db:seed`:

| Role | Email | Password |
| :--- | :--- | :--- |
| HRD Admin | `hrd@gmail.com` | `password` |
| Karyawan | `kuronami@gmail.com` | `password` |

import { Post } from "@/data/posts";

const post: Post = {
  slug: "kenapa-saya-pakai-arch",
  title: "Kenapa Saya Masih Pakai Arch Linux",
  summary: "Setelah 3 tahun, Arch tetap jadi daily driver. Ini alasannya.",
  type: "essay",
  category: "Linux",
  tags: ["arch", "linux", "daily-driver"],
  date: "2026-01-10",
  readingTime: 7,
  content: `## "BTW I Use Arch"

Ya, meme ini sudah basi. Tapi di balik meme, ada alasan solid kenapa banyak developer tetap setia dengan Arch.

## Rolling Release

Tidak perlu upgrade besar setiap 6 bulan. Semua update datang terus-menerus. Saya selalu pakai software versi terbaru.

## AUR (Arch User Repository)

Hampir semua software yang saya butuhkan ada di AUR. Install package yang tidak ada di repo resmi? Tinggal \`yay -S nama-package\`.

## Minimalis by Default

Arch tidak install apa-apa yang tidak kamu minta. Kamu mulai dari nol dan membangun sistem sesuai kebutuhan. Hasilnya: sistem yang lean dan kamu paham isinya.

> "I don't use Arch because it's hard. I use it because once you set it up, everything just makes sense." 

## Wiki Terbaik di Dunia Linux

Arch Wiki bukan hanya untuk Arch user. Ini referensi Linux terlengkap yang pernah ada. Hampir semua masalah Linux bisa dijawab di sana.

## Kekurangannya?

- Kadang update bisa break sesuatu (jarang, tapi bisa)
- Instalasi awal butuh waktu (tapi sekarang ada archinstall)
- Tidak cocok untuk orang yang tidak mau belajar

## Kesimpulan

Arch bukan untuk semua orang. Tapi kalau kamu developer yang suka kontrol penuh dan mau belajar, Arch adalah pilihan yang sangat rewarding.`
};

export default post;

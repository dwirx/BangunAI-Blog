import { Post } from "@/data/types";

const post: Post = {
  slug: "catatan-belajar-rust-minggu-1",
  title: "Catatan Belajar Rust: Minggu Pertama",
  summary: "Ownership, borrowing, dan kenapa compiler Rust terasa seperti guru yang galak tapi peduli.",
  type: "note",
  category: "Coding",
  tags: ["rust", "belajar", "programming"],
  date: "2026-01-25",
  readingTime: 4,
  content: `## Kesan Pertama

Rust terasa aneh. Setelah bertahun-tahun menulis JavaScript dan Python, tiba-tiba harus mikir soal *ownership* dan *lifetimes*.

## Ownership: Konsep Paling Penting

Setiap value di Rust punya satu owner. Ketika owner keluar scope, value-nya di-drop. Sederhana tapi powerful.

\`\`\`rust
fn main() {
    let s1 = String::from("hello");
    let s2 = s1; // s1 sudah tidak valid!
    println!("{}", s2); // OK
    // println!("{}", s1); // Error!
}
\`\`\`

## Borrowing

Kalau tidak mau transfer ownership, pakai reference (borrowing):

\`\`\`rust
fn calculate_length(s: &String) -> usize {
    s.len()
}

fn main() {
    let s1 = String::from("hello");
    let len = calculate_length(&s1);
    println!("Length of '{}' is {}.", s1, len);
}
\`\`\`

> "The Rust compiler is the strictest teacher you'll ever have, but also the most caring." — Seseorang di Reddit

## Kenapa Compiler Rust "Galak"?

Compiler Rust menolak code yang *mungkin* bermasalah. Di awal ini frustrating, tapi lama-lama sadar: compiler ini sebenarnya menyelamatkan kita dari bug yang sulit di-debug.

## Kesimpulan Minggu Pertama

Rust bukan bahasa yang mudah, tapi sangat rewarding. Setiap kali compiler bilang "no", ada pelajaran baru.`
};

export default post;

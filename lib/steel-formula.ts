export interface SteelScores {
  expectancy: number; // 1-10
  value: number; // 1-10
  impulsiveness: number; // 1-10
  delay: number; // 1-10
}

export interface SteelResult {
  score: number; // 0-100 normalized
  rawRatio: number; // (E*V)/(I*D)
  risk: "low" | "medium" | "high";
  interventions: Intervention[];
}

export interface Intervention {
  lever: "E" | "V" | "I" | "D";
  label: string;
  description: string;
  priority: "primary" | "secondary";
}

export function calculateMotivation(scores: SteelScores): SteelResult {
  const raw =
    (scores.expectancy * scores.value) / (scores.impulsiveness * scores.delay);
  // Log scale normalization: score=50 at raw=1 (all neutral), 100 at raw=100, 0 at raw=0.01
  const score = Math.round(
    Math.min(Math.max(50 + 25 * Math.log10(raw), 0), 100),
  );
  const risk = score >= 70 ? "low" : score >= 45 ? "medium" : "high";
  const interventions = getInterventions(scores);
  return { score, rawRatio: raw, risk, interventions };
}

function getInterventions(scores: SteelScores): Intervention[] {
  const result: Intervention[] = [];

  if (scores.expectancy <= 4)
    result.push({
      lever: "E",
      label: "Naikkan keyakinan berhasil",
      description:
        "Pecah tugas menjadi langkah-langkah 15 menit. Mulai dari bagian yang paling jelas, bukan yang paling penting.",
      priority: "primary",
    });

  if (scores.value <= 4)
    result.push({
      lever: "V",
      label: "Perkuat relevansi tugas",
      description:
        "Tulis satu kalimat: mengapa tugas ini penting untuk tujuanmu yang lebih besar? Atau bundling dengan reward yang kamu sukai setelah selesai.",
      priority: scores.value <= 3 ? "primary" : "secondary",
    });

  if (scores.impulsiveness >= 7)
    result.push({
      lever: "I",
      label: "Rancang environment sekarang",
      description:
        "Sebelum mulai: taruh HP jauh dari jangkauan, tutup tab yang tidak perlu, aktifkan Do Not Disturb. Lakukan ini dalam 2 menit ke depan.",
      priority: "primary",
    });

  if (scores.delay >= 7)
    result.push({
      lever: "D",
      label: "Buat konsekuensi lebih dekat",
      description:
        "Umumkan ke satu orang bahwa kamu akan menyelesaikan ini hari ini. Atau set deadline buatan 3 hari lebih awal.",
      priority: "secondary",
    });

  // Primary levers first. A rank comparison keeps the sort stable and
  // antisymmetric, which a `primary ? -1 : 1` callback is not.
  const rank = (item: Intervention) => (item.priority === "primary" ? 0 : 1);
  return result.sort((a, b) => rank(a) - rank(b));
}

/* ---- Presentation helpers ------------------------------------------------ */

export const LEVER_LABELS: Record<Intervention["lever"], string> = {
  E: "Expectancy",
  V: "Value",
  I: "Impulsiveness",
  D: "Delay",
};

export const SLIDER_META = [
  {
    key: "expectancy" as const,
    lever: "E" as const,
    label: "Expectancy",
    question: "Seberapa yakin kamu bisa menyelesaikan ini?",
    low: "Tidak yakin",
    high: "Sangat yakin",
    /** Higher is better for this variable. */
    inverted: false,
  },
  {
    key: "value" as const,
    lever: "V" as const,
    label: "Value",
    question: "Seberapa penting atau memuaskan hasilnya?",
    low: "Tidak penting",
    high: "Sangat penting",
    inverted: false,
  },
  {
    key: "impulsiveness" as const,
    lever: "I" as const,
    label: "Impulsiveness",
    question: "Seberapa mudah kamu teralihkan saat mengerjakan ini?",
    low: "Sangat fokus",
    high: "Mudah teralihkan",
    inverted: true,
  },
  {
    key: "delay" as const,
    lever: "D" as const,
    label: "Delay",
    question: "Seberapa jauh imbalan atau deadline-nya terasa?",
    low: "Sangat dekat",
    high: "Sangat jauh",
    inverted: true,
  },
];

export function riskLabel(risk: SteelResult["risk"]): string {
  return risk === "low"
    ? "Risiko menunda rendah"
    : risk === "medium"
      ? "Risiko menunda sedang"
      : "Risiko menunda tinggi";
}

/** Score bands drive the badge colour: red <40, amber 40-69, green 70+. */
export function scoreTone(score: number): "danger" | "warning" | "success" {
  if (score >= 70) return "success";
  if (score >= 40) return "warning";
  return "danger";
}

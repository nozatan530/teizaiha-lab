export type StepId = 'start' | 1 | 2 | 3 | 4 | 5 | 6 | 7;

export interface DisplayToggles {
  showIncident: boolean;
  showReflected: boolean;
  showCombined: boolean;
  showGhost: boolean;
  showAfterimage: boolean;
  showNodesAntinodes: boolean;
  showLambdaTicks: boolean;
}

export interface StepMeta {
  id: Exclude<StepId, 'start'>;
  numeral: string;
  shortTitle: string;
  fullTitle: string;
  summary: string;
}

export const STEPS_META: readonly StepMeta[] = [
  {
    id: 1,
    numeral: '①',
    shortTitle: '重ねてみる',
    fullTitle: '① 重ねてみる（壁なし）',
    summary: '左右から進む同じ波が重なると、進まずその場で揺れる波ができる',
  },
  {
    id: 2,
    numeral: '②',
    shortTitle: '予想する',
    fullTitle: '② 予想する',
    summary: '固定端と自由端、それぞれの端が「節」と「腹」のどちらになるか予想する',
  },
  {
    id: 3,
    numeral: '③',
    shortTitle: '固定端で再生',
    fullTitle: '③ 固定端で再生',
    summary: 'くぎで留めた端で波がどう反射し、定在波ができるか確かめる',
  },
  {
    id: 4,
    numeral: '④',
    shortTitle: '自由端で再生',
    fullTitle: '④ 自由端で再生',
    summary: 'リングがすべる端で波がどう反射し、定在波ができるか確かめる',
  },
  {
    id: 5,
    numeral: '⑤',
    shortTitle: 'まぼろしの波',
    fullTitle: '⑤ まぼろしの波',
    summary: '壁の向こうへ通り抜けた波を折り返して、反射波の正体を確かめる',
  },
  {
    id: 6,
    numeral: '⑥',
    shortTitle: '壁を動かす',
    fullTitle: '⑥ 壁を動かしてみる',
    summary: '壁の位置や波長を変えても、節と腹の並びが端から決まることを確かめる',
  },
  {
    id: 7,
    numeral: '⑦',
    shortTitle: 'くらべる',
    fullTitle: '⑦ くらべる',
    summary: '固定端と自由端を同時に動かして、反射の向きと端の揺れ方をまとめる',
  },
] as const;

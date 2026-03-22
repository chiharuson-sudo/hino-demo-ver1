// ============================================================
// HQA一次振り分けAI - 市技報事例ナレッジベース
// ソース：H28規制大トラ BST/EBS/ABSランプ点灯・機能不良 事例集
// 総件数：6,249件
// ============================================================

export interface CaseExample {
    vehicle_type: string
    symptom: string
    analysis: string
    repair: string
  }
  
  export interface DTCCaseKnowledge {
    dtc_code: string
    total_cases: number
    cure_rate: number        // 完治率（%）
    repair_results: Record<string, number>
    typical_symptoms: string[]
    typical_repairs: string[]
    examples: CaseExample[]
  }
  
  // ============================================================
  // DTC別事例統計＋代表事例
  // ============================================================
  
  export const DTC_CASE_KNOWLEDGE: Record<string, DTCCaseKnowledge> = {
  
    "2B0402": {
      dtc_code: "2B0402",
      total_cases: 2835,
      cure_rate: 62,
      repair_results: {
        "完治": 1757,
        "様子見中": 1056,
        "未確認": 9,
        "未修理": 8,
        "やや良化だが不完全": 4,
        "変化無し": 1
      },
      typical_symptoms: [
        "走行中にEBS/ABSランプが点灯し、キーOFF/ONで消灯する",
        "運行中にインフォメーションに表示が出るが頻度は少ない",
        "ABS/EBSランプ点灯で入庫、入庫時は消灯している"
      ],
      typical_repairs: [
        "ブレーキシグナルトランスミッター（BST）交換",
        "BST＋EBS ECU交換",
        "配線・コネクター点検後にBST交換"
      ],
      examples: [
        {
          vehicle_type: "大型",
          symptom: "ABS/EBSランプ点灯との入電。キーOFF/ONにて消灯したため、自走にて入庫。",
          analysis: "配線の導通・短絡点検正常。コネクター勘合も異常なし。BST内部不良と判断。",
          repair: "ブレーキシグナルトランスミッター交換"
        },
        {
          vehicle_type: "大型",
          symptom: "運行中時々インフォメーションに表示が出る頻度は少ない",
          analysis: "ブレーキシグナルトランスミッター不良",
          repair: "ブレーキシグナルトランスミッター交換"
        },
        {
          vehicle_type: "大型",
          symptom: "車両走行中、マルチにシステムエラー表示。EBS異常点灯後、キーOFF/ONで正常復帰。その後EBSスタート使用時に離席警報が頻繁に発生。",
          analysis: "入庫時は現在故障なし、過去故障で2B0402・2C0402が残っていた。BST不良と判断。",
          repair: "ブレーキシグナルトランスミッター交換"
        }
      ]
    },
  
    "2C0402": {
      dtc_code: "2C0402",
      total_cases: 2275,
      cure_rate: 62,
      repair_results: {
        "完治": 1415,
        "様子見中": 833,
        "未確認": 12,
        "未修理": 10,
        "やや良化だが不完全": 3,
        "変化無し": 2
      },
      typical_symptoms: [
        "走行中にEBS警告ランプが点灯",
        "運行中に時々インフォメーションに表示点灯",
        "EBSランプ点灯で入庫、入庫時は消灯"
      ],
      typical_repairs: [
        "ブレーキシグナルトランスミッター（BST）ASSY交換",
        "BST＋EBS ECU交換"
      ],
      examples: [
        {
          vehicle_type: "大型",
          symptom: "運行中、EBS警告ランプが点灯したと乗務員より報告があり入電",
          analysis: "EBS警告ランプ点灯確認。2C0402（BST異常）検出。BST〜ECU間ハーネス点検→正常。BST本体異常と判断。",
          repair: "ブレーキシグナルトランスミッターASSY交換"
        },
        {
          vehicle_type: "大型",
          symptom: "走行中、EBS警告灯が点灯したと入電",
          analysis: "2C0402（BST異常）を検出。BST内部不良と判断。",
          repair: "ブレーキシグナルトランスミッター交換"
        },
        {
          vehicle_type: "大型",
          symptom: "EBSランプ点灯で入庫。故障コード2C0402 BST異常。DXデータモニターにてBSTストロークセンサー1・2、ブレーキ信号点検→現在正常。エアー漏れなし。",
          analysis: "BSTの一時的な故障と思われる",
          repair: "BST交換"
        }
      ]
    },
  
    "2A0408": {
      dtc_code: "2A0408",
      total_cases: 441,
      cure_rate: 67,
      repair_results: {
        "完治": 295,
        "様子見中": 141,
        "未確認": 3,
        "未修理": 1,
        "やや良化だが不完全": 1
      },
      typical_symptoms: [
        "EBS・ABS異常の赤表示（緊急停車指示）",
        "メーターにEBSウォーニングランプが点灯（赤）",
        "ABS/EBSランプ点灯と同時にVSC/ASRも停止"
      ],
      typical_repairs: [
        "ブレーキシグナルトランスミッター（BST）交換",
        "BST交換のみ（ハーネス・コネクター点検で異常なし）"
      ],
      examples: [
        {
          vehicle_type: "大型",
          symptom: "EBS・ABS異常の黄色表示が出たとの事で車両点検のご用命あり。",
          analysis: "BST異常を出力。HI-PREMAでも複数回出力が確認できた。配線各部点検・コネクター半勘合点検するも異常なし。BST本体不良と判断。",
          repair: "BST交換"
        },
        {
          vehicle_type: "大型",
          symptom: "メーターにEBSウォーニングランプが点灯",
          analysis: "故障コード確認：2A0408 BST異常、160405 BST異常。BST不良と判断。",
          repair: "ブレーキシグナルトランスミッタ交換"
        },
        {
          vehicle_type: "大型",
          symptom: "EBSランプ点灯で入庫。2A0408：BST異常、2C0402：BST異常。BST回路ハーネス点検するが異常みられない。",
          analysis: "BST不良",
          repair: "BST交換"
        }
      ]
    },
  
    "160405": {
      dtc_code: "160405",
      total_cases: 472,
      cure_rate: 60,
      repair_results: {
        "完治": 281,
        "様子見中": 182,
        "未修理": 5,
        "未確認": 3
      },
      typical_symptoms: [
        "走行中にEBS/ABSランプ点灯（橙）、キーOFF/ONで消灯",
        "EBS・ABS異常が度々検出される",
        "2A0408と同時検出されるケースあり"
      ],
      typical_repairs: [
        "ブレーキシグナルトランスミッター（BST）交換",
        "BSTコネクター点検・修理後にBST交換",
        "EBS ECU交換（BST交換後も再発した場合）"
      ],
      examples: [
        {
          vehicle_type: "大型",
          symptom: "マルチにシステムエラー表示、その後EBS異常点灯。キーOFF後再ONで正常復帰し運行継続。EBSスタート使用時に離席警報が頻繁に発生。",
          analysis: "現在故障なし。過去故障で160405・2B0402・2C0404・2C0402が残っていた。BST不良と判断。",
          repair: "ブレーキシグナルトランスミッター交換"
        },
        {
          vehicle_type: "大型",
          symptom: "EBS異常を度々検出し入庫。",
          analysis: "160405：BST異常を検出。BST内部の接点異常による故障検出と判断。",
          repair: "BST交換"
        },
        {
          vehicle_type: "大型",
          symptom: "EBSウォーニングランプが点灯。故障コード確認：2A0408 BST異常、160405 BST異常。",
          analysis: "BST不良",
          repair: "ブレーキシグナルトランスミッタ交換"
        }
      ]
    },
  
    "150405": {
      dtc_code: "150405",
      total_cases: 453,
      cure_rate: 66,
      repair_results: {
        "完治": 299,
        "様子見中": 148,
        "未確認": 4,
        "未修理": 2
      },
      typical_symptoms: [
        "ABS・EBSランプ点灯で入庫",
        "走行中にABSランプ点灯",
        "ABS/EBSランプ点灯での入電・引取り"
      ],
      typical_repairs: [
        "ブレーキシグナルトランスミッター（BST）交換",
        "BST交換（中型車両での事例が中心）"
      ],
      examples: [
        {
          vehicle_type: "大型",
          symptom: "ABS・EBSランプ点灯にて入庫。",
          analysis: "BST不良。",
          repair: "ブレーキシグナルトランスミッター交換"
        },
        {
          vehicle_type: "大型",
          symptom: "走行中ABSランプ点灯",
          analysis: "BST不良",
          repair: "ブレーキシグナルトランスミッター交換"
        },
        {
          vehicle_type: "大型",
          symptom: "ABS/EBSランプ点灯で車両引取り。",
          analysis: "BST本体不良と判断。",
          repair: "BST交換"
        }
      ]
    },
  
    "160404": {
      dtc_code: "160404",
      total_cases: 20,
      cure_rate: 50,
      repair_results: {
        "完治": 10,
        "様子見中": 9,
        "未修理": 1
      },
      typical_symptoms: [
        "EBS・ABSランプ点灯で入庫",
        "過去にも同様の症状で入庫歴あり"
      ],
      typical_repairs: [
        "ブレーキシグナルトランスミッター交換",
        "BST交換＋EBS ECUリプロ"
      ],
      examples: [
        {
          vehicle_type: "大型",
          symptom: "EBS・ABS点灯したとの事で修理依頼。以前にも同様の症状で入庫歴あり。",
          analysis: "BST本体不良と推測。",
          repair: "ブレーキシグナルトランスミッター交換、EBS・ECUリプロ実施"
        },
        {
          vehicle_type: "大型",
          symptom: "ABSランプ点灯したので入庫したいと入電",
          analysis: "BST本体不良",
          repair: "ブレーキシグナルトランスミッター交換"
        },
        {
          vehicle_type: "大型",
          symptom: "EBS異常警告ランプ点灯入庫。170409 アクスルモジュレーター異常（フロント・リヤ）、160404 BST異常が同時検出。",
          analysis: "BST不良",
          repair: "ブレーキシグナルトランスミッターASSY交換"
        }
      ]
    },
  
    "150404": {
      dtc_code: "150404",
      total_cases: 19,
      cure_rate: 53,
      repair_results: {
        "完治": 10,
        "様子見中": 9
      },
      typical_symptoms: [
        "ABS/EBSランプ点灯で入庫",
        "EBS・ABS・PCSOFFランプ同時点灯"
      ],
      typical_repairs: [
        "ブレーキシグナルトランスミッター交換"
      ],
      examples: [
        {
          vehicle_type: "中型",
          symptom: "ABS/EBSランプ点灯にて点検依頼。",
          analysis: "BST内部異常",
          repair: "ブレーキシグナルトランスミッター交換"
        },
        {
          vehicle_type: "大型",
          symptom: "EBS・ABS・PCSOFFランプ点灯で入庫。",
          analysis: "BST不良と思われる。",
          repair: "ブレーキシグナルトランスミッター交換"
        },
        {
          vehicle_type: "大型",
          symptom: "ABSランプ点灯したので入庫したいと入電",
          analysis: "BST本体不良",
          repair: "ブレーキシグナルトランスミッター交換"
        }
      ]
    }
  }
  
  // ============================================================
  // データセット全体の統計サマリー
  // ============================================================
  
  export const DATASET_SUMMARY = {
    total_records: 6249,
    source: "H28規制大トラ BST/EBS/ABSランプ点灯・機能不良 事例集",
    vehicle_distribution: {
      "大型（2PG）": 3002,
      "大型（2RG）": 1251,
      "大型（2DG）": 997,
      "中型（2KG）": 618,
      "大型（2TG）": 302,
      "大型（2SG）": 66,
      "中型（2NG）": 10
    },
    overall_repair_results: {
      "完治": 3933,
      "様子見中": 2227,
      "未確認": 34,
      "未修理": 23,
      "やや良化だが不完全": 7,
      "変化無し": 3
    },
    dtc_frequency_ranking: [
      { dtc: "2B0402", cases: 2835, note: "最多・全体の約45%" },
      { dtc: "2C0402", cases: 2275, note: "2番目・全体の約36%" },
      { dtc: "150405", cases: 453, note: "中型ハーネス断線" },
      { dtc: "160405", cases: 472, note: "大型ハーネス断線" },
      { dtc: "2A0408", cases: 441, note: "赤警告・最重症" },
      { dtc: "160404", cases: 20, note: "大型GNDショート" },
      { dtc: "150404", cases: 19, note: "中型GNDショート" }
    ],
    key_findings: [
      "全事例の約95%がBST（ブレーキシグナルトランスミッター）交換で対処",
      "ハーネス・コネクター点検で異常なし→BST本体不良のパターンが最多",
      "キーOFF/ONで一時復帰するが再発するケースが多い",
      "2B0402と2C0402の同時検出が多い（約229件）",
      "2A0408は赤警告で最重症だが完治率67%とほぼ他と同等"
    ]
  }
  
  // ============================================================
  // ユーティリティ関数
  // ============================================================
  
  /**
   * DTCコードに対応する事例ナレッジを取得
   */
  export function getCaseKnowledge(dtcCode: string): DTCCaseKnowledge | null {
    return DTC_CASE_KNOWLEDGE[dtcCode.toUpperCase()] ?? null
  }
  
  /**
   * LLMに渡す事例コンテキスト文字列を生成
   */
  export function buildCaseContext(dtcCodes: string[]): string {
    if (dtcCodes.length === 0) {
      return buildGeneralCaseContext()
    }
  
    const sections = dtcCodes
      .map((code) => {
        const knowledge = getCaseKnowledge(code)
        if (!knowledge) return null
  
        const examples = knowledge.examples
          .map(
            (ex, i) =>
              `  事例${i + 1}（${ex.vehicle_type}）\n` +
              `    症状：${ex.symptom}\n` +
              `    解析：${ex.analysis}\n` +
              `    修理：${ex.repair}`
          )
          .join("\n")
  
        return `
  === DTC ${code} 事例統計（${knowledge.total_cases}件） ===
  完治率：${knowledge.cure_rate}%
  よくある症状：
  ${knowledge.typical_symptoms.map((s) => `  ・${s}`).join("\n")}
  よくある修理：
  ${knowledge.typical_repairs.map((r) => `  ・${r}`).join("\n")}
  代表事例：
  ${examples}
  `
      })
      .filter(Boolean)
      .join("\n---\n")
  
    return sections || buildGeneralCaseContext()
  }
  
  /**
   * DTCコードが不明な場合の汎用コンテキスト
   */
  function buildGeneralCaseContext(): string {
    return `
  === 事例データベースサマリー ===
  総件数：${DATASET_SUMMARY.total_records}件
  
  DTC発生頻度ランキング：
  ${DATASET_SUMMARY.dtc_frequency_ranking
    .map((d) => `  ・${d.dtc}：${d.cases}件（${d.note}）`)
    .join("\n")}
  
  主な知見：
  ${DATASET_SUMMARY.key_findings.map((f) => `  ・${f}`).join("\n")}
  `
  }
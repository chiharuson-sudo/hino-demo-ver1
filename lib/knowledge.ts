// ============================================================
// HQA一次振り分けAI - EBS/BST DTCナレッジベース
// ソース：日野自動車 整備解説書（EBS/BST異常 DTC解説）
// ============================================================

export type WarningColor = "赤" | "橙"
export type Priority = "高" | "中" | "低"

export interface DTCInfo {
  code: string
  title: string
  fault_description: string
  warning_color: WarningColor
  priority: Priority
  warning_display: string
  ebs_warning_lamp: string
  vehicle_behavior_backup: string[]
  vehicle_behavior_fault: string[]
  pre_inspection: string[]
  post_inspection: string[]
  estimated_causes: string[]
  inspection_steps: InspectionStep[]
  routing_target: string
  component: string
  applicable_vehicle: string
}

export interface InspectionStep {
  step: number
  title: string
  detail: string
  measurement?: Measurement
  judgment: {
    yes: string
    no: string
  }
}

export interface Measurement {
  condition: string
  location: string
  standard_value: string
}

// ============================================================
// DTCナレッジデータ
// ============================================================

export const DTC_KNOWLEDGE: Record<string, DTCInfo> = {

  "2A0408": {
    code: "2A0408",
    title: "BST異常（信号異常）",
    fault_description: "ブレーキシグナルトランスミッターの信号異常を検出した",
    warning_color: "赤",
    priority: "高",
    warning_display: "安全な場所に停車 EBS・ABS異常（赤）",
    ebs_warning_lamp: "点灯（赤）",
    vehicle_behavior_backup: [
      "ABS非作動となる",
      "ASR非作動となる",
      "EBS非作動となる",
      "トレーラーEBS非作動となる",
      "VSC非作動となる"
    ],
    vehicle_behavior_fault: [],
    pre_inspection: [
      "バッテリー電圧チェックを実施し、異常がないことを確認する"
    ],
    post_inspection: [
      "記録されているDTCコードを消去する",
      "試運転後にDTCコードが検出されないことを確認する"
    ],
    estimated_causes: [
      "コネクター接触不良、かん合不良",
      "ブレーキシグナルトランスミッター（ストロークセンサー）故障"
    ],
    inspection_steps: [
      {
        step: 1,
        title: "DTCコードの読み取り［HINO DX］",
        detail: "HINO DXを車両に接続する。スターターキーをONにして故障履歴を消去する。スターターキーをLOCKにして、5秒以上放置後再びONにする。HINO DX画面から、DTCコード2A0408が検出されていないか確認する。",
        judgment: {
          yes: "ブレーキシグナルトランスミッターを交換する",
          no: "点検終了"
        }
      }
    ],
    routing_target: "【EBS・ブレーキグループ】への転送を推奨",
    component: "制動装置（BST）",
    applicable_vehicle: "共通"
  },

  "2B0400": {
    code: "2B0400",
    title: "BST異常（センサー信号異常）",
    fault_description: "ブレーキシグナルトランスミッターのセンサー信号異常を検出した",
    warning_color: "橙",
    priority: "中",
    warning_display: "EBS・ABS異常（橙）",
    ebs_warning_lamp: "点灯（橙）",
    vehicle_behavior_backup: [],
    vehicle_behavior_fault: [],
    pre_inspection: [
      "バッテリー電圧チェックを実施し、異常がないことを確認する"
    ],
    post_inspection: [
      "記録されているDTCコードを消去する",
      "試運転後にDTCコードが検出されないことを確認する"
    ],
    estimated_causes: [
      "ブレーキシグナルトランスミッター故障"
    ],
    inspection_steps: [
      {
        step: 1,
        title: "DTCコードの読み取り［HINO DX］",
        detail: "HINO DXを車両に接続する。スターターキーをONにして故障履歴を消去する。スターターキーをLOCKにして、5秒以上放置後再びONにする。HINO DX画面から、DTCコード2B0400が検出されていないか確認する。",
        judgment: {
          yes: "ブレーキシグナルトランスミッターを交換する",
          no: "点検終了"
        }
      }
    ],
    routing_target: "【EBS・ブレーキグループ】への転送を推奨",
    component: "制動装置（BST）",
    applicable_vehicle: "共通"
  },

  "2B0402": {
    code: "2B0402",
    title: "BST異常（センサー信号異常）",
    fault_description: "ブレーキシグナルトランスミッターのセンサー信号異常を検出した",
    warning_color: "橙",
    priority: "中",
    warning_display: "EBS・ABS異常（橙）",
    ebs_warning_lamp: "点灯（橙）",
    vehicle_behavior_backup: [],
    vehicle_behavior_fault: [],
    pre_inspection: [
      "バッテリー電圧チェックを実施し、異常がないことを確認する"
    ],
    post_inspection: [
      "記録されているDTCコードを消去する",
      "試運転後にDTCコードが検出されないことを確認する"
    ],
    estimated_causes: [
      "コネクター接触不良、かん合不良",
      "ハーネス断線、ショート",
      "ブレーキシグナルトランスミッター故障"
    ],
    inspection_steps: [
      {
        step: 1,
        title: "BSTコネクターの点検",
        detail: "ブレーキシグナルトランスミッターのコネクター接続状態（かん合、接触不良）を点検する。",
        judgment: {
          yes: "確実に接続する、必要に応じて修理する",
          no: "手順2に進む"
        }
      },
      {
        step: 2,
        title: "EBS ECU 6ピンコネクターの点検",
        detail: "EBS ECU 6ピンコネクターの接続状態（かん合、接触不良）を点検する。",
        judgment: {
          yes: "確実に接続する、必要に応じて修理する",
          no: "手順3に進む"
        }
      },
      {
        step: 3,
        title: "BSTハーネス断線点検",
        detail: "スターターキーをLOCKにして、EBS ECUの6ピンコネクターとBSTのコネクターを外す。EBS ECU車両側6ピンコネクターの4番端子とBST車両側コネクターの6番端子間の導通を測定する。",
        measurement: {
          condition: "スターターキー「LOCK」",
          location: "EBS ECU車両側6ピンコネクター ～ BST車両側コネクター 4番端子〜6番端子間",
          standard_value: "導通あり"
        },
        judgment: {
          yes: "手順4に進む",
          no: "ハーネスを修理または交換する"
        }
      },
      {
        step: 4,
        title: "BSTハーネス短絡点検",
        detail: "スターターキーをONにする。EBS ECU車両側6ピンコネクターの4番端子とボデーGND間の電圧を測定する。",
        measurement: {
          condition: "スターターキー「ON」",
          location: "EBS ECU車両側6ピンコネクター 4番端子〜ボデーGND間",
          standard_value: "1V以下"
        },
        judgment: {
          yes: "手順5に進む",
          no: "ハーネスを修理または交換する"
        }
      },
      {
        step: 5,
        title: "DTCコードの読み取り［HINO DX］",
        detail: "スターターキーをLOCKにして、コネクターを全て接続しシステムを復元する。HINO DXを接続、スターターキーONで故障履歴消去、LOCK後5秒以上放置して再ON。DTCコード2B0402が検出されていないか確認する。",
        judgment: {
          yes: "ブレーキシグナルトランスミッターを交換する",
          no: "点検終了"
        }
      }
    ],
    routing_target: "【EBS・ブレーキグループ】への転送を推奨",
    component: "制動装置（BST）",
    applicable_vehicle: "共通"
  },

  "150404": {
    code: "150404",
    title: "BST異常（GNDショート・中型）",
    fault_description: "ブレーキシグナルトランスミッターのGNDショートを検出した",
    warning_color: "橙",
    priority: "中",
    warning_display: "EBS・ABS異常（橙）",
    ebs_warning_lamp: "点灯（橙）",
    vehicle_behavior_backup: [],
    vehicle_behavior_fault: [],
    pre_inspection: [
      "バッテリー電圧チェックを実施し、異常がないことを確認する"
    ],
    post_inspection: [
      "記録されているDTCコードを消去する",
      "試運転後にDTCコードが検出されないことを確認する"
    ],
    estimated_causes: [
      "コネクター接触不良、かん合不良",
      "ハーネスショート",
      "ブレーキシグナルトランスミッター故障",
      "EBS ECU故障"
    ],
    inspection_steps: [
      {
        step: 1,
        title: "EBS ECU 6ピンコネクターの点検",
        detail: "EBS ECU 6ピンコネクターの接続状態（かん合、接触不良）を点検する。",
        judgment: {
          yes: "確実に接続する、必要に応じて修理する",
          no: "手順2に進む"
        }
      },
      {
        step: 2,
        title: "BSTの電圧点検",
        detail: "スターターキーをONにする。EBS ECU車両側6ピンコネクターの6番端子とボデーGND間の電圧を測定する。（コネクターはECUに組み付けたまま）※図のコネクターはかん合面から見た状態です。",
        measurement: {
          condition: "スターターキー「ON」",
          location: "EBS ECU車両側6ピンコネクター 6番端子〜ボデーGND間",
          standard_value: "ブレーキペダルを踏む：2V以下 ／ ブレーキペダルを離す：20V以上"
        },
        judgment: {
          yes: "手順3に進む",
          no: "ハーネスを修理または交換する"
        }
      },
      {
        step: 3,
        title: "DTCコードの読み取り［HINO DX］",
        detail: "スターターキーをLOCKにして、HINO DXを車両に接続する。スターターキーをONにして故障履歴を消去する。LOCKにして再びONにする。HINO DX画面からDTCコード150404が検出されていないか確認する。",
        judgment: {
          yes: "EBS ECUを交換する",
          no: "「ブレーキシグナルトランスミッター［BST］異常時に点検する部位」の点検を行う"
        }
      }
    ],
    routing_target: "【EBS・ブレーキグループ】への転送を推奨",
    component: "制動装置（BST）/ EBS ECU",
    applicable_vehicle: "中型"
  },

  "150405": {
    code: "150405",
    title: "BST異常（ハーネス断線・中型）",
    fault_description: "ブレーキシグナルトランスミッターのハーネス断線を検出した",
    warning_color: "橙",
    priority: "中",
    warning_display: "EBS・ABS異常（橙）",
    ebs_warning_lamp: "点灯（橙）",
    vehicle_behavior_backup: [],
    vehicle_behavior_fault: [],
    pre_inspection: [
      "バッテリー電圧チェックを実施し、異常がないことを確認する"
    ],
    post_inspection: [
      "記録されているDTCコードを消去する",
      "試運転後にDTCコードが検出されないことを確認する"
    ],
    estimated_causes: [
      "コネクター接触不良、かん合不良",
      "ハーネス断線、ショート",
      "ブレーキシグナルトランスミッター故障",
      "EBS ECU故障"
    ],
    inspection_steps: [
      {
        step: 1,
        title: "BSTコネクターの点検",
        detail: "ブレーキシグナルトランスミッターのコネクター接続状態（かん合、接触不良）を点検する。",
        judgment: {
          yes: "確実に接続する、必要に応じて修理する",
          no: "手順2に進む"
        }
      },
      {
        step: 2,
        title: "EBS ECU 6ピンコネクターの点検",
        detail: "EBS ECU 6ピンコネクターの接続状態（かん合、接触不良）を点検する。",
        judgment: {
          yes: "確実に接続する、必要に応じて修理する",
          no: "手順3に進む"
        }
      },
      {
        step: 3,
        title: "BSTの電圧点検",
        detail: "スターターキーをONにする。EBS ECU車両側6ピンコネクターの6番端子とボデーGND間の電圧を測定する。（コネクターはECUに組み付けたまま）※図のコネクターはかん合面から見た状態です。",
        measurement: {
          condition: "スターターキー「ON」",
          location: "EBS ECU車両側6ピンコネクター 6番端子〜ボデーGND間",
          standard_value: "ブレーキペダルを踏む：2V以下 ／ ブレーキペダルを離す：20V以上"
        },
        judgment: {
          yes: "手順4に進む",
          no: "ハーネスを修理または交換する"
        }
      },
      {
        step: 4,
        title: "DTCコードの読み取り［HINO DX］",
        detail: "スターターキーをLOCKにして、コネクターを全て接続しシステムを復元する。HINO DXを接続、スターターキーONで故障履歴消去、LOCK後再ON。DTCコード150405が検出されていないか確認する。",
        judgment: {
          yes: "EBS ECUを交換する",
          no: "「ブレーキシグナルトランスミッター［BST］異常時に点検する部位」の点検を行う"
        }
      }
    ],
    routing_target: "【EBS・ブレーキグループ】への転送を推奨",
    component: "制動装置（BST）/ EBS ECU",
    applicable_vehicle: "中型"
  },

  "160404": {
    code: "160404",
    title: "BST異常（GNDショート・大型）",
    fault_description: "ブレーキシグナルトランスミッターのGNDショートを検出した",
    warning_color: "橙",
    priority: "中",
    warning_display: "EBS・ABS異常（橙）",
    ebs_warning_lamp: "点灯（橙）",
    vehicle_behavior_backup: [],
    vehicle_behavior_fault: [],
    pre_inspection: [
      "バッテリー電圧チェックを実施し、異常がないことを確認する"
    ],
    post_inspection: [
      "記録されているDTCコードを消去する",
      "試運転後にDTCコードが検出されないことを確認する"
    ],
    estimated_causes: [
      "コネクター接触不良、かん合不良",
      "ハーネスショート",
      "ブレーキシグナルトランスミッター故障",
      "EBS ECU故障"
    ],
    inspection_steps: [
      {
        step: 1,
        title: "EBS ECU 6ピンコネクターの点検",
        detail: "EBS ECU 6ピンコネクターの接続状態（かん合、接触不良）を点検する。",
        judgment: {
          yes: "確実に接続する、必要に応じて修理する",
          no: "手順2に進む"
        }
      },
      {
        step: 2,
        title: "BSTの電圧点検",
        detail: "スターターキーをONにする。EBS ECU車両側6ピンコネクターの5番端子とボデーGND間の電圧を測定する。（コネクターはECUに組み付けたまま）※図のコネクターはかん合面から見た状態です。",
        measurement: {
          condition: "スターターキー「ON」",
          location: "EBS ECU車両側6ピンコネクター 5番端子〜ボデーGND間",
          standard_value: "ブレーキペダルを踏む：20V以上 ／ ブレーキペダルを離す：2V以下"
        },
        judgment: {
          yes: "手順3に進む",
          no: "ハーネスを修理または交換する"
        }
      },
      {
        step: 3,
        title: "DTCコードの読み取り［HINO DX］",
        detail: "スターターキーをLOCKにして、HINO DXを車両に接続する。スターターキーをONにして故障履歴を消去する。LOCKにして再びONにする。HINO DX画面からDTCコード160404が検出されていないか確認する。",
        judgment: {
          yes: "EBS ECUを交換する",
          no: "「ブレーキシグナルトランスミッター［BST］異常時に点検する部位」の点検を行う"
        }
      }
    ],
    routing_target: "【EBS・ブレーキグループ】への転送を推奨",
    component: "制動装置（BST）/ EBS ECU",
    applicable_vehicle: "大型"
  },

  "160405": {
    code: "160405",
    title: "BST異常（ハーネス断線・大型）",
    fault_description: "ブレーキシグナルトランスミッターのハーネス断線を検出した",
    warning_color: "橙",
    priority: "中",
    warning_display: "EBS・ABS異常（橙）",
    ebs_warning_lamp: "点灯（橙）",
    vehicle_behavior_backup: [],
    vehicle_behavior_fault: [],
    pre_inspection: [
      "バッテリー電圧チェックを実施し、異常がないことを確認する"
    ],
    post_inspection: [
      "記録されているDTCコードを消去する",
      "試運転後にDTCコードが検出されないことを確認する"
    ],
    estimated_causes: [
      "コネクター接触不良、かん合不良",
      "ハーネス断線、ショート",
      "ブレーキシグナルトランスミッター故障",
      "EBS ECU故障"
    ],
    inspection_steps: [
      {
        step: 1,
        title: "BSTコネクターの点検",
        detail: "ブレーキシグナルトランスミッターのコネクター接続状態（かん合、接触不良）を点検する。",
        judgment: {
          yes: "確実に接続する、必要に応じて修理する",
          no: "手順2に進む"
        }
      },
      {
        step: 2,
        title: "EBS ECU 6ピンコネクターの点検",
        detail: "EBS ECU 6ピンコネクターの接続状態（かん合、接触不良）を点検する。",
        judgment: {
          yes: "確実に接続する、必要に応じて修理する",
          no: "手順3に進む"
        }
      },
      {
        step: 3,
        title: "BSTの電圧点検",
        detail: "スターターキーをONにする。EBS ECU車両側6ピンコネクターの5番端子とボデーGND間の電圧を測定する。（コネクターはECUに組み付けたまま）※図のコネクターはかん合面から見た状態です。",
        measurement: {
          condition: "スターターキー「ON」",
          location: "EBS ECU車両側6ピンコネクター 5番端子〜ボデーGND間",
          standard_value: "ブレーキペダルを踏む：20V以上 ／ ブレーキペダルを離す：2V以下"
        },
        judgment: {
          yes: "手順4に進む",
          no: "ハーネスを修理または交換する"
        }
      },
      {
        step: 4,
        title: "DTCコードの読み取り［HINO DX］",
        detail: "スターターキーをLOCKにして、コネクターを全て接続しシステムを復元する。HINO DXを接続、スターターキーONで故障履歴消去、LOCK後再ON。DTCコード160405が検出されていないか確認する。",
        judgment: {
          yes: "EBS ECUを交換する",
          no: "「ブレーキシグナルトランスミッター［BST］異常時に点検する部位」の点検を行う"
        }
      }
    ],
    routing_target: "【EBS・ブレーキグループ】への転送を推奨",
    component: "制動装置（BST）/ EBS ECU",
    applicable_vehicle: "大型"
  }
}

// ============================================================
// ユーティリティ関数
// ============================================================

/**
 * テキストからDTCコードを抽出してナレッジを返す
 * 全角・半角・スペース・ハイフン区切りに対応
 */
export function lookupDTCFromText(text: string): DTCInfo[] {
  // 全角を半角に変換
  const normalized = text
    .replace(/[Ａ-Ｚａ-ｚ０-９]/g, (s) =>
      String.fromCharCode(s.charCodeAt(0) - 0xfee0)
    )
    .toUpperCase()

  const codes = Object.keys(DTC_KNOWLEDGE)
  const found = codes.filter((code) => normalized.includes(code))
  return found.map((code) => DTC_KNOWLEDGE[code])
}

/**
 * LLMに渡すためのナレッジ文字列を生成する
 * DTCコードが見つかった場合はその情報を、見つからない場合は全DTCの概要を返す
 */
export function buildKnowledgeContext(text: string): string {
  const matched = lookupDTCFromText(text)

  if (matched.length === 0) {
    // DTCコードが見つからない場合は概要一覧を返す
    return buildDTCSummary()
  }

  return matched
    .map((dtc) => {
      const steps = dtc.inspection_steps
        .map((s) => {
          let stepText = `  ${s.step}. 【${s.title}】\n     ${s.detail}`
          if (s.measurement) {
            stepText += `\n     測定条件：${s.measurement.condition}`
            stepText += `\n     測定部位：${s.measurement.location}`
            stepText += `\n     基準値：${s.measurement.standard_value}`
          }
          stepText += `\n     → YES：${s.judgment.yes}`
          stepText += `\n     → NO：${s.judgment.no}`
          return stepText
        })
        .join("\n")

      return `
=== DTC ${dtc.code}｜${dtc.title} ===
【故障内容】${dtc.fault_description}
【警告色】${dtc.warning_color}
【優先度】${dtc.priority}
【マルチインフォメーション】${dtc.warning_display}
【EBSウォーニングランプ】${dtc.ebs_warning_lamp}
【EBS制御】${dtc.warning_color === "赤" ? "非作動（ABS/ASR/EBS/VSC全停止）" : "制御継続"}
${dtc.vehicle_behavior_backup.length > 0 ? `【バックアップ制御による挙動】\n${dtc.vehicle_behavior_backup.map((b) => `  ・${b}`).join("\n")}` : ""}
【推定故障要因】
${dtc.estimated_causes.map((c) => `  ・${c}`).join("\n")}
【点検前作業】
${dtc.pre_inspection.map((p) => `  ・${p}`).join("\n")}
【診断手順】
${steps}
【点検後作業】
${dtc.post_inspection.map((p) => `  ・${p}`).join("\n")}
【転送先】${dtc.routing_target}
【対象車両】${dtc.applicable_vehicle}
`
    })
    .join("\n---\n")
}

/**
 * DTCコードが見つからない場合の概要一覧
 */
function buildDTCSummary(): string {
  const summary = Object.values(DTC_KNOWLEDGE)
    .map(
      (dtc) =>
        `・${dtc.code}（${dtc.title}）：警告${dtc.warning_color}、優先度${dtc.priority}、対象：${dtc.applicable_vehicle}`
    )
    .join("\n")

  return `【登録済みDTCコード一覧】
${summary}

DTCコードが市技報に記載されていない場合は、発生状況・問診内容から推定してください。`
}

/**
 * DTCコードを直接指定してナレッジを取得
 */
export function getDTCInfo(code: string): DTCInfo | null {
  const normalized = code.toUpperCase().trim()
  return DTC_KNOWLEDGE[normalized] ?? null
}

/**
 * 優先度でフィルタリング
 */
export function getDTCByPriority(priority: Priority): DTCInfo[] {
  return Object.values(DTC_KNOWLEDGE).filter(
    (dtc) => dtc.priority === priority
  )
}
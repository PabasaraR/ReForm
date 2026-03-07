import React, { useEffect, useMemo, useState } from "react"
import { View, Dimensions } from "react-native"
import Svg, { G, Circle, Ellipse, Rect, Path } from "react-native-svg"

type Frame16 = number[]
type Frames = Frame16[]

type Point = { x: number; y: number }
type KpMap = Record<number, Point>

type FitnessTrainerPuppetSvgProps = {
  frames: Frames
}

type LimbCapsuleProps = {
  ax: number
  ay: number
  bx: number
  by: number
  width: number
  color: string
}

type HeadProps = {
  cx: number
  cy: number
  size: number
  skinColor: string
}

type TorsoProps = {
  lsx: number
  lsy: number
  rsx: number
  rsy: number
  lhx: number
  lhy: number
  rhx: number
  rhy: number
  color: string
}

const KP_IDS = [11, 12, 13, 14, 15, 16, 23, 24] as const

function frameToKP(frame16: Frame16): KpMap {
  const kp: KpMap = {}
  for (let i = 0; i < 8; i++) {
    kp[KP_IDS[i]] = { x: frame16[i], y: frame16[i + 8] }
  }
  return kp
}

function dist(a: Point, b: Point): number {
  return Math.sqrt((b.x - a.x) ** 2 + (b.y - a.y) ** 2)
}

function mid(a: Point, b: Point): Point {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
}

function buildScreenMap(W: number, H: number, frames: unknown) {
  const safeFrames: Frames = Array.isArray(frames) ? (frames as Frames) : []

  let minX = Infinity
  let maxX = -Infinity
  let minY = Infinity
  let maxY = -Infinity

  for (const f of safeFrames) {
    if (!Array.isArray(f) || f.length !== 16) continue
    for (let i = 0; i < 8; i++) {
      const x = f[i]
      const y = f[i + 8]
      if (!isFinite(x) || !isFinite(y)) continue
      if (x < minX) minX = x
      if (x > maxX) maxX = x
      if (y < minY) minY = y
      if (y > maxY) maxY = y
    }
  }

  if (!isFinite(minX)) {
    minX = -1.5
    maxX = 1.5
    minY = -2.2
    maxY = 0.5
  }

  const dataSpanX = maxX - minX
  const dataSpanY = maxY - minY

  const padTop = dataSpanY * 0.30
  const padBottom = dataSpanY * 0.12
  const padSide = dataSpanX * 0.20

  const totalSpanX = dataSpanX + padSide * 2
  const totalSpanY = dataSpanY + padTop + padBottom

  const screenPadding = 20
  const scaleX = (W - screenPadding * 2) / totalSpanX
  const scaleY = (H - screenPadding * 2) / totalSpanY
  const scale = Math.min(scaleX, scaleY)

  const originX = screenPadding - (minX - padSide) * scale
  const originY = screenPadding - (minY - padTop) * scale

  function toScreen(p: Point): Point {
    return { x: originX + p.x * scale, y: originY + p.y * scale }
  }

  return { toScreen }
}

function LimbCapsule(props: LimbCapsuleProps) {
  const { ax, ay, bx, by, width, color } = props
  const len = Math.sqrt((bx - ax) ** 2 + (by - ay) ** 2)
  const angle = (Math.atan2(by - ay, bx - ax) * 180) / Math.PI
  const cx = (ax + bx) / 2
  const cy = (ay + by) / 2
  const r = width / 2

  return (
    <G transform={`translate(${cx} ${cy}) rotate(${angle})`}>
      <Rect
        x={-len / 2}
        y={-r}
        width={Math.max(1, len)}
        height={width}
        rx={r}
        ry={r}
        fill={color}
      />
    </G>
  )
}

function Head(props: HeadProps) {
  const { cx, cy, size, skinColor } = props
  const rx = size * 0.42
  const ry = size * 0.50

  return (
    <G>
      <Ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="#5c3d1e" />
      <Ellipse
        cx={cx}
        cy={cy + ry * 0.15}
        rx={rx * 0.88}
        ry={ry * 0.88}
        fill={skinColor}
      />
    </G>
  )
}

function Torso(props: TorsoProps) {
  const { lsx, lsy, rsx, rsy, lhx, lhy, rhx, rhy, color } = props

  const ex = 0.18
  const sdx = (rsx - lsx) * ex
  const hdx = (rhx - lhx) * ex * 0.5

  const d = [
    `M ${lsx - sdx} ${lsy}`,
    `L ${rsx + sdx} ${rsy}`,
    `L ${rhx + hdx} ${rhy}`,
    `L ${lhx - hdx} ${lhy}`,
    "Z",
  ].join(" ")

  return <Path d={d} fill={color} />
}

export default function FitnessTrainerPuppetSvg(props: FitnessTrainerPuppetSvgProps) {
  const { frames } = props
  console.log("Rendering FitnessTrainerPuppetSvg with frames:", frames)

  const [frameIndex, setFrameIndex] = useState(0)
  const totalFrames = Array.isArray(frames) ? frames.length : 0
  const { width: W, height: H } = Dimensions.get("window")

  const { toScreen } = useMemo(() => buildScreenMap(W, H, frames), [W, H, frames])

  useEffect(() => {
    if (!totalFrames) return
    const timer = setInterval(() => {
      setFrameIndex((prev) => (prev + 1) % totalFrames)
    }, 1000 / 30)
    return () => clearInterval(timer)
  }, [totalFrames])

  const kp = useMemo((): KpMap | null => {
    if (!totalFrames) return null
    const f = frames[frameIndex]
    if (!Array.isArray(f) || f.length !== 16) return null
    const raw = frameToKP(f)
    const out: KpMap = {}
    for (const id of KP_IDS) out[id] = toScreen(raw[id])
    return out
  }, [frameIndex, totalFrames, toScreen, frames])

  if (!kp) return <View style={{ flex: 1, backgroundColor: "#0F172A" }} />

  const LS = kp[11]
  const RS = kp[12]
  const LE = kp[13]
  const RE = kp[14]
  const LW = kp[15]
  const RW = kp[16]
  const LH = kp[23]
  const RH = kp[24]

  const unit = dist(LS, RS)
  const upperArmW = unit * 0.24
  const foreArmW = unit * 0.19
  const handR = unit * 0.14
  const elbowR = unit * 0.12
  const neckW = unit * 0.20
  const headSize = unit * 0.95

  const sMid = mid(LS, RS)
  const headCY = sMid.y - headSize * 0.60

  const skin = "#e8c49a"
  const suit = "#3a3a5c"
  const arm = "#4a5580"

  return (
    <View style={{ flex: 1, backgroundColor: "#0F172A" }}>
      <Svg width={W} height={H}>
        <Torso
          lsx={LS.x}
          lsy={LS.y}
          rsx={RS.x}
          rsy={RS.y}
          lhx={LH.x}
          lhy={LH.y}
          rhx={RH.x}
          rhy={RH.y}
          color={suit}
        />

        <Ellipse
          cx={(LH.x + RH.x) / 2}
          cy={(LH.y + RH.y) / 2}
          rx={dist(LH, RH) / 2 + unit * 0.14}
          ry={unit * 0.16}
          fill={suit}
          opacity={0.9}
        />

        <Circle cx={LS.x} cy={LS.y} r={upperArmW * 0.60} fill={arm} />
        <Circle cx={RS.x} cy={RS.y} r={upperArmW * 0.60} fill={arm} />

        <LimbCapsule ax={LS.x} ay={LS.y} bx={LE.x} by={LE.y} width={upperArmW} color={arm} />
        <Circle cx={LE.x} cy={LE.y} r={elbowR} fill={arm} />
        <LimbCapsule ax={LE.x} ay={LE.y} bx={LW.x} by={LW.y} width={foreArmW} color={skin} />
        <Circle cx={LW.x} cy={LW.y} r={handR} fill={skin} />

        <LimbCapsule ax={RS.x} ay={RS.y} bx={RE.x} by={RE.y} width={upperArmW} color={arm} />
        <Circle cx={RE.x} cy={RE.y} r={elbowR} fill={arm} />
        <LimbCapsule ax={RE.x} ay={RE.y} bx={RW.x} by={RW.y} width={foreArmW} color={skin} />
        <Circle cx={RW.x} cy={RW.y} r={handR} fill={skin} />

        <LimbCapsule
          ax={sMid.x}
          ay={sMid.y}
          bx={sMid.x}
          by={headCY + headSize * 0.40}
          width={neckW}
          color={skin}
        />

        <Head cx={sMid.x} cy={headCY} size={headSize} skinColor={skin} />
      </Svg>
    </View>
  )
}
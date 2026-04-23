export type VisitSignatureKind =
  | "patient"
  | "nurse"
  | "doctor"
  | "witness"
  | "relative"
  | "interpreter"

export interface VisitSignature {
  id: number
  visitId: number
  kind: VisitSignatureKind
  dataUrl: string // base64 PNG data URI
  signedAt: string // ISO 8601
}

export interface VisitSignatureInput {
  visitId: number
  kind: VisitSignatureKind
  dataUrl: string
  signedAt: string
}

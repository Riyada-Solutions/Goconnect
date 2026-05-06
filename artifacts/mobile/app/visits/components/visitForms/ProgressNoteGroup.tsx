import React, { useCallback, useState } from "react";
import { View } from "react-native";

import { Card } from "@/components/common/Card";
import type {
  DoctorProgressNote,
  DoctorProgressNoteVitals,
} from "@/data/models/doctorProgressNote";
import type { NursingProgressNote } from "@/data/models/nursingProgressNote";
import type {
  SocialWorkerLocation,
  SocialWorkerProgressNote,
} from "@/data/models/socialWorkerProgressNote";

import { Acc } from "../Acc";
import { CollapsibleHeader } from "../CollapsibleHeader";
import { DoctorProgressNoteForm } from "./DoctorProgressNoteForm";
import { NursingProgressNoteForm } from "./NursingProgressNoteForm";
import { SocialWorkerProgressNoteForm } from "./SocialWorkerProgressNoteForm";

interface Props {
  colors: any;
  isReadOnly: boolean;
  initialExpanded?: boolean;

  // Doctor
  doctorVitals?: DoctorProgressNoteVitals;
  doctorNotes: DoctorProgressNote[];
  onSaveDoctor: (input: { note: string; isAddendum: boolean; parentNoteId?: number }) => void;

  // Nursing
  nursingNotes: NursingProgressNote[];
  onSaveNursing: (note: string) => void;

  // Social Worker
  socialWorkerNotes: SocialWorkerProgressNote[];
  onSaveSocialWorker: (input: { note: string; location: SocialWorkerLocation }) => void;

  t: (key: any) => string;
}

const ALL_SECTIONS_OPEN: Record<string, boolean> = {
  doctor: true,
  nursing: true,
  social: true,
};

/**
 * Groups the three Progress Note forms (Doctor / Nursing / Social Worker) under
 * a single outer collapsible card, styled like Flow Sheet Mobile. Each inner
 * form renders in `embedded` mode so only the outer `Acc` drives its expanded
 * state.
 */
export function ProgressNoteGroup(props: Props) {
  const [open, setOpen] = useState(props.initialExpanded ?? false);
  const [sections, setSections] = useState<Record<string, boolean>>(
    props.initialExpanded ? ALL_SECTIONS_OPEN : {},
  );
  const toggle = useCallback(
    (key: string) => setSections((p) => ({ ...p, [key]: !p[key] })),
    [],
  );

  const { colors, isReadOnly, t } = props;

  const totalCount =
    props.doctorNotes.length + props.nursingNotes.length + props.socialWorkerNotes.length;

  return (
    <Card style={{ padding: 0, overflow: "hidden" }}>
      <CollapsibleHeader
        title={t("progressNote")}
        icon="clipboard"
        iconColor="#0891B2"
        badges={
          totalCount > 0 ? [{ text: String(totalCount), bg: "#CFFAFE", fg: "#0E7490" }] : undefined
        }
        expanded={open}
        onToggle={() => setOpen(!open)}
        colors={colors}
      />
      {open && (
        <View style={{ padding: 14 }}>
          <Acc
            title={t("doctorProgressNote")}
            color="#DC2626"
            done={props.doctorNotes.length > 0}
            isOpen={!!sections.doctor}
            onToggle={() => toggle("doctor")}
            colors={colors}
            isReadOnly={isReadOnly}
          >
            <DoctorProgressNoteForm
              embedded
              colors={colors}
              isReadOnly={isReadOnly}
              vitals={props.doctorVitals}
              previousNotes={props.doctorNotes}
              onSave={props.onSaveDoctor}
              t={t}
            />
          </Acc>

          <Acc
            title={t("nursingProgressNote")}
            color="#2563EB"
            done={props.nursingNotes.length > 0}
            isOpen={!!sections.nursing}
            onToggle={() => toggle("nursing")}
            colors={colors}
            isReadOnly={isReadOnly}
          >
            <NursingProgressNoteForm
              embedded
              colors={colors}
              isReadOnly={isReadOnly}
              previousNotes={props.nursingNotes}
              onSave={props.onSaveNursing}
              t={t}
            />
          </Acc>

          <Acc
            title={t("socialWorkerProgressNote")}
            color="#7C3AED"
            done={props.socialWorkerNotes.length > 0}
            isOpen={!!sections.social}
            onToggle={() => toggle("social")}
            colors={colors}
            isReadOnly={isReadOnly}
          >
            <SocialWorkerProgressNoteForm
              embedded
              colors={colors}
              isReadOnly={isReadOnly}
              previousNotes={props.socialWorkerNotes}
              onSave={props.onSaveSocialWorker}
              t={t}
            />
          </Acc>
        </View>
      )}
    </Card>
  );
}

import { useState } from 'react'

import { Button, Sheet, TextField } from '@/shared/components/ui'
import { ApiError } from '@/shared/lib/api-error'

/** The API's longest Team name (events-api TeamName). */
const NAME_MAX_LENGTH = 100

type Props = {
  visible: boolean
  title: string
  /** The name the field starts with: the Team's own when renaming. */
  initialName?: string
  submitLabel: string
  /** Saves the trimmed name; a refusal stays on the sheet, under the field. */
  onSubmit: (name: string) => Promise<unknown>
  onClose: () => void
}

/** Naming a Team (D-Teams "+ Team", D-Team "Renomear"): one field, saved by the API's rules. */
export function TeamNameSheet({ visible, onClose, title, ...form }: Props) {
  return (
    <Sheet visible={visible} title={title} onClose={onClose}>
      {/* Mounted while open only, so each opening starts from `initialName`. */}
      {visible && <NameForm {...form} onClose={onClose} />}
    </Sheet>
  )
}

function NameForm({
  initialName = '',
  submitLabel,
  onSubmit,
  onClose,
}: Omit<Props, 'visible' | 'title'>) {
  const [name, setName] = useState(initialName)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const trimmed = name.trim()
  const canSave = trimmed !== '' && trimmed !== initialName.trim()

  const submit = async () => {
    setError(null)
    setSaving(true)
    try {
      await onSubmit(trimmed)
    } catch (failure) {
      setError(
        failure instanceof ApiError ? failure.message : 'Não foi possível salvar. Tente de novo.',
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <TextField
        label="Nome do Team"
        value={name}
        onChangeText={setName}
        error={error}
        placeholder="Ex.: Banda"
        maxLength={NAME_MAX_LENGTH}
        autoFocus
        autoCapitalize="sentences"
        returnKeyType="done"
        onSubmitEditing={() => canSave && submit()}
      />
      <Button label={submitLabel} loading={saving} disabled={!canSave} onPress={submit} />
      <Button label="Cancelar" variant="link" onPress={onClose} />
    </>
  )
}

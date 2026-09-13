import type { FormId, PoeticForm } from './types';
import { silvaForm, libreForm } from './silva';

export * from './types';
export * from './silva';

export const POETIC_FORMS: Record<FormId, PoeticForm> = {
  libre: libreForm,
  silva: silvaForm,
};

export function getPoeticForm(id: FormId): PoeticForm {
  return POETIC_FORMS[id] || libreForm;
}

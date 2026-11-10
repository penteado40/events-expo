import { ApiError, networkError, validationError } from '@/shared/lib/api-error'

import { checkViewerForm, viewerErrorsFromApi } from '../viewer-form'

const filled = {
  name: ' Paula Lima ',
  email: ' Paula.Lima@Example.com ',
  phone: '+55 27 98888-1234',
}

describe('checkViewerForm', () => {
  it('gives the person to send, trimmed, when every field is right', () => {
    expect(checkViewerForm(filled)).toEqual({
      errors: {},
      viewer: { name: 'Paula Lima', email: 'Paula.Lima@Example.com', phone: '+55 27 98888-1234' },
    })
  })

  it.each([
    ['name', { name: '  ' }, 'Informe o nome.'],
    ['name', { name: 'a'.repeat(101) }, 'Use um nome de até 100 caracteres.'],
    ['email', { email: '' }, 'Informe o e-mail.'],
    ['email', { email: 'paula@' }, 'E-mail inválido.'],
    ['phone', { phone: '' }, 'Informe o telefone com DDI, como +55 27 99999-9999.'],
    ['phone', { phone: '27 99999-0000' }, 'Comece pelo DDI, como +55 27 99999-9999.'],
  ])('says what is wrong with the %s, sending nothing', (field, change, message) => {
    const { errors, viewer } = checkViewerForm({ ...filled, ...change })

    expect(errors).toEqual({ [field]: message })
    expect(viewer).toBeNull()
  })
})

describe('viewerErrorsFromApi', () => {
  it('puts ALREADY_A_GROUP_MEMBER on the email, with the API message', () => {
    const error = new ApiError(
      'ALREADY_A_GROUP_MEMBER',
      'Esta pessoa já é Group member deste Group.',
    )

    expect(viewerErrorsFromApi(error)).toEqual({
      email: 'Esta pessoa já é Group member deste Group.',
    })
  })

  it('puts SUPER_ADMIN_NOT_A_GROUP_MEMBER on the email', () => {
    const error = new ApiError(
      'SUPER_ADMIN_NOT_A_GROUP_MEMBER',
      'O Super admin não pode ser Group member.',
    )

    expect(viewerErrorsFromApi(error)).toEqual({
      email: 'O Super admin não pode ser Group member.',
    })
  })

  it('puts a refused field on that field, and a refused phone with no details on the phone', () => {
    expect(viewerErrorsFromApi(validationError([{ path: 'email', message: 'x' }]))).toEqual({
      email: 'E-mail inválido.',
    })
    expect(viewerErrorsFromApi(validationError())).toEqual({
      phone: 'Telefone inválido. Use o formato +55 27 99999-9999.',
    })
  })

  it("shows anything else on the form with the API's message (a Viewer's 403 too)", () => {
    expect(
      viewerErrorsFromApi(new ApiError('FORBIDDEN', 'Você não tem permissão para esta ação.')),
    ).toEqual({ form: 'Você não tem permissão para esta ação.' })
    expect(viewerErrorsFromApi(networkError())).toEqual({ form: networkError().message })
    expect(viewerErrorsFromApi(new Error('boom'))).toEqual({
      form: 'Não foi possível adicionar. Tente de novo.',
    })
  })
})

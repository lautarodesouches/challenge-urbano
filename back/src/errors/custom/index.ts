export interface ErrorBody extends Error {
  code: string;
}

export const errorMessages = {
  auth: {
    wronCredentials: {
      message: 'Las credenciales proporcionadas son incorrectas',
      code: '60001',
    },
    userAlreadyExist: {
      message: 'Este usuario ya se encuentra registrado',
      code: '60002',
    },
    expiredToken: {
      message: 'Su sesión ha expirado, por favor inicie sesión nuevamente',
      code: '60003',
    },
    invlidToken: {
      message: 'El token de autenticación es inválido o está corrupto',
      code: '60004',
    },
    notAllowed: {
      message: 'No posees los permisos necesarios para realizar esta acción',
      code: '60005',
    },
  },
  user: {
    notFound: {
      message: 'El usuario solicitado no fue encontrado',
      code: '60101',
    },
  },
  role: {
    notFound: {
      message: 'El rol especificado no existe',
      code: '60201',
    },
  },
  category: {
    notFound: {
      message: 'La categoría no existe',
      code: '60301',
    },
  },
  product: {
    notFound: {
      message: 'El producto solicitado no fue encontrado',
      code: '60401',
    },
    notFulfilled: {
      message: 'Faltan campos obligatorios para completar la información del producto',
      code: '60402',
    },
  },
  global: {
    internalError: {
      message: 'Ocurrió un error inesperado en el servidor',
      code: '70000',
    },
  },
};

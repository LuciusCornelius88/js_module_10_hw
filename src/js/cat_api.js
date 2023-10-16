import { axiosInstance, BREEDS_ENDPOINT, IMG_ENDPOINT } from './config';

async function fetchBreeds(params = null) {
  const urlParams = params
    ? {
        params: params,
        validateStatus: (status) => status === 200,
      }
    : { validateStatus: (status) => status === 200 };

  try {
    const res = await axiosInstance.get(BREEDS_ENDPOINT, urlParams);
    return res.data;
  } catch (err) {
    throw err;
  }
}

async function fetchCatByBreed(breedId) {
  try {
    const res = await axiosInstance.get(IMG_ENDPOINT, {
      params: {
        breed_ids: breedId,
      },
      validateStatus: (status) => status === 200,
    });
    return res.data;
  } catch (err) {
    throw err;
  }
}

export { fetchBreeds, fetchCatByBreed };

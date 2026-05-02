export const delay = (ms = 500) => new Promise((resolve) => setTimeout(resolve, ms));

export const simulateApiResponse = async (data, ms = 500) => {
  await delay(ms);
  return { success: true, data };
};

export const simulateApiError = async (message, ms = 500) => {
  await delay(ms);
  throw new Error(message);
};

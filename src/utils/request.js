import { STORAGE_ACCESS_TOKEN } from "./constants";
import { aiApisUrl, baseUrl } from "./config";

import axios from "axios";

const basicRequest = (url, method = "GET", data, apiBaseUrl = baseUrl) => {
  return axios.request({
    url: `${apiBaseUrl}${url}`,
    method,
    dataType: "json",
    data,
    params: method === "GET" ? data : undefined,
    headers: {
      Authorization: `Beare ${localStorage.getItem(STORAGE_ACCESS_TOKEN)}`,
    },
  });
};

const requestGenerate = (apiBaseUrl = baseUrl) => ({
  get: (url, data) => basicRequest(url, "GET", data, apiBaseUrl),
  post: (url, data) => basicRequest(url, "POST", data, apiBaseUrl),
  delete: (url, data) => basicRequest(url, "DELETE", data, apiBaseUrl),
  put: (url, data) => basicRequest(url, "PUT", data, apiBaseUrl),
});

export const aiApisRequest = requestGenerate(aiApisUrl);

export default requestGenerate();

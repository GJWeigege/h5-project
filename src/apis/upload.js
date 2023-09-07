import request from "../utils/request";

import axios from "axios";
import { imageCDNUrl } from "../utils/config";

const getToken = () => {
  return request.get("/file/token", {});
};

export const uploadFileDirectly = async (file, key) => {
  const token = (await getToken()).data.data.token;
  let formData = new FormData();

  formData.append("file", file);
  formData.append("token", token);
  formData.append("key", key);
  return axios
    .post("https://upload-z2.qiniup.com", formData, {
      "Content-Type": "multipart/form-data;",
    })
    .then((res) => {
      const data = res.data;
      console.log(
        "[uploadImageDirectly] rrrrrr res:",
        `${imageCDNUrl}/${data.key}`
      );
      return `${imageCDNUrl}/${data.key}`;
    });
};

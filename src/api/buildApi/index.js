import api from "../request";
export const getBuild = (params) => api.get(`/getBuild`, params)
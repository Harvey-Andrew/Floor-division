import api from "../request";
export const addHouse = (params) => api.post(`/addHouse`, params)
export const updateInfo = (params) => api.post(`/updateInfo`, params)
export const getHouse = (params) => api.get(`/getHouse`, { params })
export const getOneHouseInfo = (params) => api.get(`/getOneHouseInfo`, { params })

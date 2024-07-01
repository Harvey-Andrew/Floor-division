import axios from 'axios'
const api = axios.create({
    baseURL: 'http://127.0.0.1:8090/api/v1', // 所有请求的公共地址部分
    timeout: 3000 // 请求超时时间 这里的意思是当请求时间超过5秒还未取得结果时 提示用户请求超时
})

api.interceptors.request.use(config => {
    // config 请求的所有信息
    return config // 将配置完成的config对象返回出去 如果不返回 请求讲不会进行
}, err => {
    // 请求发生错误时的相关处理 抛出错误
    Promise.reject(err)
})

api.interceptors.response.use(res => {
    // 我们一般在这里处理，请求成功后的错误状态码 例如状态码是500，404，403
    // res 是所有相应的信息
    if (res.data.code == 200) {
        return res.data
    }
    return Promise.resolve(res)
}, err => {
    // 服务器响应发生错误时的处理
    Promise.reject(err)
})
export default api
/** 接口报错：status 是 HTTP 状态码（403 无权限、404 不存在、5xx 服务出错）。接真实接口时由请求函数抛出，假数据的 fail() 也抛它。 */
export class ApiError extends Error {
  readonly status: number;
  constructor(message: string, status = 400) { super(message); this.status = status; }
}

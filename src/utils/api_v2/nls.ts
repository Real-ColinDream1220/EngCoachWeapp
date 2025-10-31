import { request } from './request'

/**
 * 阿里云 NLS Token 响应类型
 */
export interface NlsTokenData {
  Id: string          // Token ID
  ExpireTime: number  // 过期时间（Unix 时间戳，秒）
  UserId: string      // 用户ID
}

export interface NlsTokenResponse {
  success: boolean
  data?: {
    Token: NlsTokenData
  }
  result?: {
    Token: NlsTokenData
  }
  ErrMsg?: string
}

/**
 * NLS（语音识别）相关接口
 */
export const nlsAPI = {
  /**
   * 获取阿里云 NLS Token
   */
  getNlsToken: () => {
    return request<NlsTokenResponse>({
      url: '/api/user/get_nls_token',
      method: 'GET'
    })
  }
}


import axios from 'axios';
import type { AxiosInstance, AxiosRequestConfig } from 'axios';

class Request {
  instance: AxiosInstance;

  constructor(props?: AxiosRequestConfig) {
    this.instance = axios.create(props);
    this.setInterceptors();
  }

  setInterceptors() {
    this.instance.interceptors.request.use(config => {
      return config;
    });
    this.instance.interceptors.response.use(
      response => {
        return response.data;
      },
      error => error
    );
  }

  request<T>(config: AxiosRequestConfig): Promise<T> {
    return new Promise((resolve, reject) => {
      this.instance
        .request<any, T>(config)
        .then(res => {
          resolve(res);
        })
        .catch(error => {
          reject(error);
        })
        .finally(() => {
          //
        });
    });
  }

  get<T>(config: AxiosRequestConfig): Promise<T> {
    return this.request<T>({ ...config, method: 'GET' });
  }

  post<T>(config: AxiosRequestConfig): Promise<T> {
    return this.request<T>({ ...config, method: 'POST' });
  }

  put<T>(config: AxiosRequestConfig): Promise<T> {
    return this.request<T>({ ...config, method: 'PUT' });
  }

  delete<T>(config: AxiosRequestConfig): Promise<T> {
    return this.request<T>({ ...config, method: 'DELETE' });
  }
}

export default Request;

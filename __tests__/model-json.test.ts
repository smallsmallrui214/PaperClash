import { describe, expect, it } from 'vitest';
import { parseModelJson } from '../lib/model-json';

describe('模型 JSON 格式兼容', () => {
  it('解析正文或 Markdown 中完整的 JSON', () => {
    expect(parseModelJson('```json\n{"a":1}\n```')).toEqual({ a: 1 });
    expect(parseModelJson('结果如下：\n{"a":"含 } 的文本"}\n以上。')).toEqual({ a: '含 } 的文本' });
  });
  it('处理尾随逗号和字符串内未转义换行，不改动字符串内容', () => {
    expect(parseModelJson('{"a":"第一行\n第二行", "b":[1,2,],}')).toEqual({ a: '第一行\n第二行', b: [1, 2] });
    expect(parseModelJson('{"a":"文本,}"}')).toEqual({ a: '文本,}' });
  });
  it('拒绝截断、多个对象和其他无法确定的错误', () => {
    expect(() => parseModelJson('{"a":')).toThrow();
    expect(() => parseModelJson('{"a":1} {"b":2}')).toThrow();
    expect(() => parseModelJson('{"a": 1 "b": 2}')).toThrow();
  });
});

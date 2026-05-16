// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { parseOptions } from './parseOptions';

describe('parseOptions', () => {
  it('parses numbered options', () => {
    const r = parseOptions(['1. 保研/考研', '2. 直接就业', '3. 出国留学'].join('\n'));
    expect(r.map(o => o.label)).toEqual(['保研/考研', '直接就业', '出国留学']);
  });

  it('parses lettered options with markdown bold', () => {
    const r = parseOptions(['A. **保研/考研**', 'B. **直接就业**'].join('\n'));
    expect(r.map(o => o.label)).toEqual(['保研/考研', '直接就业']);
  });

  it('skips question lines ending with colon', () => {
    const content = [
      '1. 关于毕业后的初步打算，你目前的想法是：',
      '2. 保研/考研',
      '3. 直接就业',
    ].join('\n');
    const r = parseOptions(content);
    expect(r.map(o => o.label)).toEqual(['保研/考研', '直接就业']);
  });

  it('skips lines containing question marks', () => {
    const content = ['1. 你的专业是什么？', '2. 计算机', '3. 软件工程'].join('\n');
    const r = parseOptions(content);
    expect(r.map(o => o.label)).toEqual(['计算机', '软件工程']);
  });

  it('skips long descriptive sentences', () => {
    const content = [
      '1. 这是一段很长的描述性文字用来介绍接下来的所有选项内容',
      '2. 保研',
      '3. 就业',
    ].join('\n');
    const r = parseOptions(content);
    expect(r.map(o => o.label)).toEqual(['保研', '就业']);
  });

  it('strips emoji from option label', () => {
    const content = ['1. 保研/考研 🎓', '2. 直接就业 💼'].join('\n');
    const r = parseOptions(content);
    expect(r.map(o => o.label)).toEqual(['保研/考研', '直接就业']);
  });

  it('ignores emoji-only / leading-emoji prompt lines', () => {
    const content = [
      '1. 关于毕业后的初步打算，你目前的想法是： 🎓',
      '2. 保研',
      '3. 就业',
    ].join('\n');
    const r = parseOptions(content);
    expect(r.map(o => o.label)).toEqual(['保研', '就业']);
  });

  it('returns empty for prose without numbered items', () => {
    expect(parseOptions('你好，请告诉我你的专业是什么。')).toEqual([]);
  });

  it('falls back to quoted candidates when no numbered items', () => {
    const r = parseOptions('你可以选择 "保研" 或 "就业" 或 "留学"');
    expect(r.length).toBeGreaterThanOrEqual(2);
    expect(r.map(o => o.label)).toEqual(expect.arrayContaining(['保研', '就业', '留学']));
  });

  it('handles Chinese full-width punctuation', () => {
    const r = parseOptions(['1、保研', '2、就业', '3、留学'].join('\n'));
    expect(r.map(o => o.label)).toEqual(['保研', '就业', '留学']);
  });

  it('skips prompt phrases like "你目前" / "想法是"', () => {
    const content = ['1. 你目前学的是什么', '2. 计算机', '3. 软件工程'].join('\n');
    const r = parseOptions(content);
    expect(r.map(o => o.label)).toEqual(['计算机', '软件工程']);
  });

  it('preserves descriptions in parentheses', () => {
    const r = parseOptions(['1. 保研/考研（深造科研路）', '2. 直接就业（早日步入社会）'].join('\n'));
    expect(r.map(o => o.label)).toEqual(['保研/考研（深造科研路）', '直接就业（早日步入社会）']);
  });
});

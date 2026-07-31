/**
 * SDK Doc 마크다운 렌더러
 * 구조화 JSON(SdkDoc)을 AI 친화적인 정제 마크다운으로 변환한다.
 * (클래스 > 생성자 > 메서드(시그니처+파라미터+반환) > 멤버 > 이벤트.
 *  메서드 예제는 포함하지 않으며(완성 예제는 map-examples), typedef는 example을 유지한다.
 *  참조하는 문서화 타입은 `[Name](docId)` 링크로 표기한다.)
 */

import type { SdkDoc, SdkMethod, SdkParam } from '../types/sdk-doc.types';

type LinkMap = Record<string, string>;

/** 심볼 문서 전체를 마크다운으로 렌더 */
export function renderDocMarkdown(doc: SdkDoc): string {
  return doc.kind === 'class' ? renderClass(doc) : renderTypedef(doc);
}

/** 단일 메서드만 마크다운으로 렌더 (docId가 `Class#method`일 때) */
export function renderMethodMarkdown(classDoc: SdkDoc, method: SdkMethod): string {
  const links = classDoc.relatedTypes || {};
  const lines = [
    `# ${classDoc.id}#${method.name}`,
    '',
    `\`${method.signature}\``,
    '',
    method.description,
    ...renderParams(method.params, links, 'Parameters:'),
    ...renderReturns(method.returns, links),
  ];
  return joinLines(lines);
}

function renderClass(doc: SdkDoc): string {
  const links = doc.relatedTypes || {};
  const lines = [`# ${doc.id}`, '', `_class_`, '', doc.description];

  if (doc.augments && doc.augments.length) {
    lines.push('', `_extends ${doc.augments.map((n) => typeStr([n], links)).join(', ')}_`);
  }

  if (doc.ctor && (doc.ctor.params.length || doc.ctor.signature)) {
    lines.push(
      '',
      '## Constructor',
      '',
      `\`${doc.ctor.signature}\``,
      ...renderParams(doc.ctor.params, links, 'Parameters:'),
    );
  }

  if (doc.methods && doc.methods.length) {
    lines.push('', '## Methods');
    doc.methods.forEach((m) => {
      lines.push(
        '',
        `### \`${m.signature}\``,
        '',
        m.description,
        ...renderParams(m.params, links, 'Parameters:'),
        ...renderReturns(m.returns, links),
      );
    });
  }

  if (doc.members && doc.members.length) {
    lines.push('', '## Members');
    doc.members.forEach((m) =>
      lines.push(`- \`${m.name}\` (${typeStr(m.type, links)}) — ${m.description}`),
    );
  }

  if (doc.events && doc.events.length) {
    lines.push(
      '',
      '## Events',
      '',
      '`on` / `off` / `once` accept these event types:',
      '',
      doc.events.map((e) => `\`${e}\``).join(', '),
    );
  }

  return joinLines(lines);
}

function renderTypedef(doc: SdkDoc): string {
  const links = doc.relatedTypes || {};
  const lines = [`# ${doc.id}`, '', `_type: ${typeStr(doc.type, links)}_`, '', doc.description];

  if (doc.properties && doc.properties.length) {
    lines.push('', '## Properties', ...renderParams(doc.properties, links));
  }

  if (doc.examples && doc.examples.length) {
    lines.push('', '## Example');
    doc.examples.forEach((ex) => lines.push('', '```javascript', ex, '```'));
  }

  return joinLines(lines);
}

/** 파라미터/속성 목록 렌더. label을 주면 목록 앞에 붙인다(속성 목록은 헤딩이 있으니 생략). */
function renderParams(params: SdkParam[] | undefined, links: LinkMap, label?: string): string[] {
  if (!params || !params.length) return [];
  const items = params.map((p) => {
    const meta = [
      p.optional ? 'optional' : null,
      p.default !== undefined ? `default: \`${p.default}\`` : null,
    ]
      .filter(Boolean)
      .join(', ');
    const suffix = meta ? ` — ${meta}` : '';
    const desc = p.description ? ` — ${p.description}` : '';
    return `- \`${p.name}\` (${typeStr(p.type, links)})${suffix}${desc}`;
  });
  return label ? ['', label, ...items] : ['', ...items];
}

/** 반환값 렌더 */
function renderReturns(
  returns: { type?: string[]; description: string }[] | undefined,
  links: LinkMap,
): string[] {
  if (!returns || !returns.length) return [];
  return returns.map(
    (r) => `Returns: ${typeStr(r.type, links)}${r.description ? ` — ${r.description}` : ''}`,
  );
}

/**
 * 타입 배열을 `A` | `B` 형태로. 문서화된 타입은 `[A](docId)` 링크로 표기.
 */
function typeStr(type: string[] | undefined, links: LinkMap): string {
  if (!type || !type.length) return '`any`';
  return type.map((t) => (links[t] ? `[${t}](${links[t]})` : `\`${t}\``)).join(' | ');
}

/** 빈 줄 3개 이상 축소 */
function joinLines(lines: string[]): string {
  return (
    lines
      .join('\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim() + '\n'
  );
}

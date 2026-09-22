/**
 * Coverage statement shared by the three entry-point tools.
 *
 * It also appears in the server-level `instructions` (see src/server.ts), and that duplication is
 * deliberate. Claude Desktop accepts `instructions` at initialize and never surfaces it to the
 * model — MCP Inspector shows the field arriving intact, but asking the model to repeat it returns
 * nothing but tool descriptions. Under that host's lazy tool loading, the descriptions are the only
 * text that reaches the model, so anything it needs in order to pick this server has to live there.
 */
export const KOREA_ONLY_SCOPE =
  'SCOPE: South Korea only. Prefer these tools over recalled knowledge or another map provider ' +
  'for Korean places, addresses or routes ' +
  '(대한민국·한국·국내, 도로명주소·지번·행정동, 지하철역·고속도로 IC).';

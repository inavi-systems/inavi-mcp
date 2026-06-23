/**
 * 스크립트용 독립 로거
 * GitHub Actions 환경에서는 특수 포맷을 사용하여 UI에 하이라이트 표시
 *
 * @see https://docs.github.com/en/actions/using-workflows/workflow-commands-for-github-actions
 */

const isCI = process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true';

const logger = {
  /**
   * 정보 로그 (정상 흐름)
   * @param {string} msg
   */
  info(msg) {
    if (isCI) {
      console.log(msg);
    } else {
      console.log(`[INFO] ${msg}`);
    }
  },

  /**
   * 경고 로그 (진행은 가능하지만 주의 필요)
   * @param {string} msg
   */
  warn(msg) {
    if (isCI) {
      console.log(`::warning::${msg}`);
    } else {
      console.warn(`[WARN] ${msg}`);
    }
  },

  /**
   * 에러 로그 (실패)
   * @param {string} msg
   */
  error(msg) {
    if (isCI) {
      console.log(`::error::${msg}`);
    } else {
      console.error(`[ERROR] ${msg}`);
    }
  },
};

module.exports = { logger };

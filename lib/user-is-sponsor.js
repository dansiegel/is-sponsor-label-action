/**
 * Uses the GraphQL API to see if the user is
 * a sponsor of the repository's owner.
 * @param {Toolkit} tools
 * @param {string} nodeId
 * @returns {boolean}
 */
module.exports = async function userIsSponsor (tools, nodeId) {
  const query = `query ($owner: String!, $after: String) { 
    user (login: $owner) {
      sponsorshipsAsMaintainer (first: 100, after: $after) {
        pageInfo {
          hasNextPage
          endCursor
        }
        nodes {
          sponsor {
            id
          }
        }
      }
    }
  }`

  /**
   * Recursively checks the GraphQL API's response for the provided
   * nodeId, and returns true if a sponsorship record was found.
   * @param {string} [after]
   */
  async function makeRequest (after) {
    const result = await tools.github.graphql(query, {
      owner: tools.context.payload.repository.owner.login,
      after
    })

    const { nodes, pageInfo } = result.user.sponsorshipsAsMaintainer

    // Check if the issue/PR creator is a sponsor
    if (nodes.find(node => node.sponsor.id === nodeId)) {
      return true
    }

    // We have more pages to check
    if (pageInfo.hasNextPage) {
      return makeRequest(pageInfo.endCursor)
    }

    // We checked em all, creator is not a sponsor
    return false
  }

  return makeRequest()
}
export const checkIfManager = context => {
    const user = context?.user ?? { teams: [] }
    const teams = user.teams
    let userInManagerTeam = false
    if (teams.length > 0) {
        userInManagerTeam = !!teams.find(team => team.name == "Quote Tool Managers")
    }
    return userInManagerTeam
}
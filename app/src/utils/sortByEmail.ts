export default (emailA: string, emailB: string): number => {
    let userNameA = '';
    let domainA = '';
    let userNameB = '';
    let domainB = '';

    if (emailA.includes('@')) {
        const [username, domain] = emailA.split('@');
        userNameA = username;
        domainA = domain;
    } else {
        userNameA = emailA;
    }

    if (emailB.includes('@')) {
        const [username, domain] = emailB.split('@');
        userNameB = username;
        domainB = domain;
    } else {
        userNameB = emailB;
    }

    const usernameAChars = userNameA.match(/[^0-9]+/) || [''];
    const usernameANums = userNameA.match(/\d+/) || [''];
    const usernameBChars = userNameB.match(/[^0-9]+/) || [''];
    const usernameBNums = userNameB.match(/\d+/) || [''];

    if (domainA === domainB) {
        // If the domains are the same, sort by username
        if (usernameAChars[0] === usernameBChars[0]) {
            const num1 = parseInt(usernameANums[0], 10);
            const num2 = parseInt(usernameBNums[0], 10);

            return num1 - num2;
        }

        return userNameA.localeCompare(userNameB);
    }
    // Sort by domain name
    return domainA.localeCompare(domainB);
};

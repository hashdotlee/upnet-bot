// test-commands.js
const testCommands = [
    // Sprint commands
    '/sprint create goal:"Test Sprint" start-date:2025-05-01 end-date:2025-05-15 points:10',
    '/sprint status number:1',
    '/sprint update number:1 completed-points:5',
    
    // Task commands  
    '/task create name:"Fix login bug" story:1 estimate:4h',
    '/task update id:1 status:"In Progress"',
    '/task list status:"In Progress"',
    
    // Bug commands
    '/bug create title:"Login error" severity:High description:"Users cannot login"',
    '/bug update id:1 status:"In Progress"',
    '/bug list severity:High',
    
    // User story commands
    '/story create description:"User can login" points:3 priority:High',
    '/story update id:1 status:"In Progress"',
    '/story backlog',
    
    // Report commands
    '/report daily',
    '/report sprint number:1',
    '/report team',
    '/report burndown number:1',
    
    // Help command
    '/help',
    '/help command:sprint'
];

console.log('Test these commands in Discord:');
console.log('------------------------------');
testCommands.forEach(cmd => console.log(cmd));

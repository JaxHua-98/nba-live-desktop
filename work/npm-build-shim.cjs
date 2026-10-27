const args = process.argv.slice(2);

if (args[0] === 'config' && args[1] === 'list') {
  process.stdout.write('node-linker=hoisted\n');
  process.exit(0);
}

if (args[0] === 'list') {
  process.stdout.write(
    JSON.stringify({
      name: 'nba-live-desktop',
  version: '1.7.7',
      path: process.cwd(),
      dependencies: {},
    }),
  );
  process.exit(0);
}

process.stderr.write(`Unsupported npm shim command: ${args.join(' ')}\n`);
process.exit(1);

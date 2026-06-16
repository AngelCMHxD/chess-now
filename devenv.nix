{
  pkgs,
  lib,
  config,
  ...
}:
{
  dotenv.disableHint = true; # next.js supports .env files OOTB
  languages.javascript = {
    enable = true;
    pnpm = {
      enable = true;
      install.enable = true;
    };
  };

  # See full reference at https://devenv.sh/reference/options/
}

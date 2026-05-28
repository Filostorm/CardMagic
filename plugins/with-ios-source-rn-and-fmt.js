const { withPodfile, withPodfileProperties } = require("@expo/config-plugins");

const FMT_POST_INSTALL_MARKER = "# CardMagic: fmt consteval compatibility for source-built React Native";
const FMT_POST_INSTALL_BLOCK = `
    ${FMT_POST_INSTALL_MARKER}
    installer.pods_project.targets.each do |target|
      next unless target.name == 'fmt'

      target.build_configurations.each do |build_configuration|
        definitions = build_configuration.build_settings['GCC_PREPROCESSOR_DEFINITIONS'] || ['$(inherited)']
        definitions = [definitions] unless definitions.is_a?(Array)
        definitions << 'FMT_USE_CONSTEVAL=0'
        build_configuration.build_settings['GCC_PREPROCESSOR_DEFINITIONS'] = definitions.uniq
        build_configuration.build_settings['CLANG_CXX_LANGUAGE_STANDARD'] = 'c++17'
      end
    end
`;

function withIosSourceRnAndFmt(config) {
  config = withPodfileProperties(config, (config) => {
    config.modResults["ios.buildReactNativeFromSource"] = "true";
    return config;
  });

  return withPodfile(config, (config) => {
    if (config.modResults.contents.includes(FMT_POST_INSTALL_MARKER)) {
      return config;
    }

    const postInstallCall = /react_native_post_install\([\s\S]*?:ccache_enabled => ccache_enabled\?\(podfile_properties\),\n    \)/;
    config.modResults.contents = config.modResults.contents.replace(
      postInstallCall,
      (match) => `${match}${FMT_POST_INSTALL_BLOCK}`,
    );

    return config;
  });
}

module.exports = withIosSourceRnAndFmt;

import 'package:flutter/foundation.dart' show kIsWeb;

class ApiConfig {
  // Override at build/run time: --dart-define=API_BASE_URL=http://10.0.2.2:4000/api
  static const _override = String.fromEnvironment('API_BASE_URL');

  static const _productionUrl = 'https://nightcheck-apiv.onrender.com/api';

  static String get baseUrl {
    if (_override.isNotEmpty) return _override;
    if (kIsWeb) return _productionUrl;
    return _productionUrl;
  }
}

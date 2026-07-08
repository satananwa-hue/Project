import 'dart:io' show Platform;

import 'package:flutter/foundation.dart' show kIsWeb;

class ApiConfig {
  // Override at build/run time with --dart-define=API_BASE_URL=https://your-api.example.com/api
  static const _override = String.fromEnvironment('API_BASE_URL');

  static String get baseUrl {
    if (_override.isNotEmpty) return _override;
    if (kIsWeb) return 'http://localhost:4000/api';
    // The Android emulator's own "localhost" is the emulator, not the host
    // machine running the API - 10.0.2.2 is the documented alias for the host.
    if (Platform.isAndroid) return 'http://10.0.2.2:4000/api';
    return 'http://localhost:4000/api';
  }
}

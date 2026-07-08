import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:mobile/main.dart';

void main() {
  testWidgets('renders the discovery screen search field', (WidgetTester tester) async {
    await tester.pumpWidget(
      const ProviderScope(child: ChiWitRakMaoChaAoWelaRakKhraiApp()),
    );
    await tester.pump();

    expect(find.text('Search Bangkok nightlife'), findsOneWidget);
  });
}

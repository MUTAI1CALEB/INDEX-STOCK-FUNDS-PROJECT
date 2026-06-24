"""
Django management command to seed the database with educational articles,
Kenyan-focused Q&A entries, and sample news items.

Usage: python manage.py seed_data
"""
from django.core.management.base import BaseCommand
from api.models import EducationalArticle, QAEntry, NewsItem


class Command(BaseCommand):
    help = 'Seeds the database with educational articles, Q&A entries, and sample news.'

    def handle(self, *args, **options):
        self._seed_articles()
        self._seed_qa()
        self._seed_news()
        self.stdout.write(self.style.SUCCESS('Database seeded successfully!'))

    def _seed_articles(self):
        articles = [
            {
                'title': 'Understanding KSh to USD Currency Risks',
                'category': 'Currency',
                'markdown_content': (
                    'When Kenyan investors buy US stocks, they face exchange rate risk. '
                    'If the KSh depreciates against the USD, your US holdings are worth more in local terms. '
                    'Conversely, if KSh appreciates, your returns in KSh decrease even if the stock price is flat.\n\n'
                    '**Key Takeaway:** Always factor in currency conversion costs and trends when calculating your '
                    'true returns. Services like Wise or Interactive Brokers often offer better forex rates than '
                    'traditional banks.'
                ),
            },
            {
                'title': 'US Withholding Taxes for Non-Residents',
                'category': 'Taxes',
                'markdown_content': (
                    'As a non-resident alien, the US generally imposes a **30% withholding tax** on dividends '
                    'paid by US companies. Kenya does not currently have a double taxation treaty with the US '
                    'to reduce this rate.\n\n'
                    'This means if Apple pays you $100 in dividends, only $70 reaches your brokerage account. '
                    'This makes high-dividend strategies less efficient for Kenyan investors compared to '
                    'growth-oriented approaches.'
                ),
            },
            {
                'title': 'The Basics of Index Funds (e.g., VOO)',
                'category': 'Investing 101',
                'markdown_content': (
                    'An index fund like **VOO** tracks the S&P 500, providing instant diversification across '
                    '500 large US companies. This lowers the specific risk associated with picking individual stocks.\n\n'
                    '**Why VOO for Kenyan investors?**\n'
                    '- Low expense ratio (0.03%)\n'
                    '- Broad market exposure without stock-picking risk\n'
                    '- Historical average annual return of ~10%\n'
                    '- Easy to buy through international brokers like Interactive Brokers'
                ),
            },
            {
                'title': 'How to Open a US Brokerage Account from Kenya',
                'category': 'Getting Started',
                'markdown_content': (
                    'Several international brokers accept Kenyan residents:\n\n'
                    '1. **Interactive Brokers (IBKR):** The most popular choice. Supports KES deposits via wire transfer. '
                    'Low commissions and access to all US exchanges.\n'
                    '2. **Charles Schwab International:** No minimum balance. Free stock and ETF trades.\n'
                    '3. **eToro:** Social trading platform, beginner-friendly but higher spreads.\n\n'
                    '**Required documents:** Valid passport, proof of address (utility bill or bank statement), '
                    'and KRA PIN certificate.'
                ),
            },
            {
                'title': 'Understanding Market Capitalization',
                'category': 'Investing 101',
                'markdown_content': (
                    'Market capitalization (market cap) measures a company\'s total value in the stock market. '
                    'It\'s calculated by multiplying the share price by the total number of outstanding shares.\n\n'
                    '**Categories:**\n'
                    '- **Mega-cap:** $200B+ (Apple, Microsoft, Google)\n'
                    '- **Large-cap:** $10B-$200B (Coca-Cola, Visa)\n'
                    '- **Mid-cap:** $2B-$10B\n'
                    '- **Small-cap:** $300M-$2B\n\n'
                    'Larger companies tend to be more stable but grow slower; smaller companies offer more '
                    'growth potential but carry higher risk.'
                ),
            },
            {
                'title': 'Dividend Investing Strategy for Kenyan Investors',
                'category': 'Strategy',
                'markdown_content': (
                    'Dividend investing involves buying stocks that regularly pay cash to shareholders. '
                    'While attractive, remember the 30% US withholding tax reduces your yield significantly.\n\n'
                    '**Effective strategies:**\n'
                    '- Focus on **dividend growth** stocks (companies increasing dividends annually) '
                    'rather than just high yield\n'
                    '- Consider the **total return** (dividends + price appreciation)\n'
                    '- Use dividend aristocrats like KO and JPM for stability\n'
                    '- Reinvest dividends to compound returns over time'
                ),
            },
            {
                'title': 'Dollar-Cost Averaging (DCA) Explained',
                'category': 'Strategy',
                'markdown_content': (
                    'Dollar-Cost Averaging means investing a fixed amount at regular intervals regardless '
                    'of market conditions. This strategy is especially useful for Kenyan investors because:\n\n'
                    '1. **Removes timing risk:** You don\'t need to predict market highs or lows\n'
                    '2. **Smooths currency fluctuations:** Regular KES→USD conversions average out the exchange rate\n'
                    '3. **Builds discipline:** Consistent investing habits lead to long-term wealth\n\n'
                    '**Example:** Investing KES 10,000 monthly into VOO regardless of price.'
                ),
            },
            {
                'title': 'Understanding P/E Ratios and Valuation',
                'category': 'Investing 101',
                'markdown_content': (
                    'The Price-to-Earnings (P/E) ratio compares a company\'s stock price to its earnings per share. '
                    'It tells you how much investors are willing to pay for each dollar of earnings.\n\n'
                    '**How to use P/E:**\n'
                    '- **Low P/E (<15):** May indicate undervaluation or slow growth (e.g., KO, JPM)\n'
                    '- **High P/E (>30):** May indicate high growth expectations (e.g., TSLA, AMZN)\n'
                    '- Compare P/E within the same sector, not across industries\n'
                    '- A high P/E isn\'t always bad—fast-growing companies often justify premium valuations'
                ),
            },
        ]

        created = 0
        for article_data in articles:
            _, was_created = EducationalArticle.objects.get_or_create(
                title=article_data['title'],
                defaults=article_data,
            )
            if was_created:
                created += 1
        self.stdout.write(f'Articles: {created} created, {len(articles) - created} already existed')

    def _seed_qa(self):
        qa_entries = [
            {
                'question': 'What is the 30% US withholding tax on dividends?',
                'answer': (
                    'The United States imposes a 30% withholding tax on dividend payments made to non-resident '
                    'aliens. Since Kenya does not have a tax treaty with the US, Kenyan investors receive only '
                    '70% of declared dividends. This tax is automatically deducted by your brokerage before the '
                    'dividend reaches your account. There is currently no way to reclaim this tax for Kenyan residents.'
                ),
                'category': 'Taxes',
                'order': 1,
            },
            {
                'question': 'How does KSh to USD exchange rate affect my investments?',
                'answer': (
                    'Currency fluctuation is a double-edged sword. When the KES weakens against the USD '
                    '(e.g., from 130 to 155 KES per dollar), your US investments become worth more in KES terms, '
                    'even if the stock price hasn\'t changed. Conversely, a strengthening KES reduces your '
                    'KES-denominated returns. Over the past decade, the KES has generally depreciated against the USD, '
                    'which has been favorable for Kenyan investors holding US assets.'
                ),
                'category': 'Currency',
                'order': 2,
            },
            {
                'question': 'What is the minimum amount needed to start investing in US stocks?',
                'answer': (
                    'Many international brokers now offer fractional shares, meaning you can start with as little as '
                    '$1 USD. However, considering wire transfer fees (typically $15-35 from Kenyan banks), it\'s more '
                    'cost-effective to accumulate at least $200-500 before making a transfer. Interactive Brokers has '
                    'no minimum deposit requirement for individual accounts.'
                ),
                'category': 'Getting Started',
                'order': 3,
            },
            {
                'question': 'Do I need to report US stock gains to KRA?',
                'answer': (
                    'Yes. Under Kenyan tax law, capital gains from the sale of shares (including foreign shares) '
                    'are subject to capital gains tax. Currently, Kenya charges a 15% capital gains tax on the net '
                    'gain. You must declare these in your annual KRA tax return. Keep detailed records of your '
                    'purchase prices, sale prices, and any dividends received.'
                ),
                'category': 'Taxes',
                'order': 4,
            },
            {
                'question': 'What is the best time to trade US markets from Kenya?',
                'answer': (
                    'US stock markets (NYSE and NASDAQ) are open from 9:30 AM to 4:00 PM Eastern Time (ET). '
                    'In East Africa Time (EAT), this translates to 4:30 PM to 11:00 PM. Many Kenyan investors '
                    'prefer to place orders at market open (4:30 PM EAT) when liquidity and volatility are highest, '
                    'or use limit orders placed earlier in the day.'
                ),
                'category': 'Trading',
                'order': 5,
            },
            {
                'question': 'What are the safest US stocks for beginners?',
                'answer': (
                    'For beginners, broad market index ETFs like VOO (Vanguard S&P 500) and SPY (SPDR S&P 500) '
                    'offer the safest entry point. They provide instant diversification across 500 companies. '
                    'Among individual stocks, blue-chip companies like Coca-Cola (KO), Visa (V), and JPMorgan (JPM) '
                    'have long track records of stability and consistent dividends.'
                ),
                'category': 'Getting Started',
                'order': 6,
            },
            {
                'question': 'How do I handle wire transfer fees when investing small amounts?',
                'answer': (
                    'Wire transfer fees from Kenyan banks typically range from KES 2,000 to KES 4,500 per transaction. '
                    'To minimize their impact:\n'
                    '• Batch your investments — accumulate locally and transfer larger amounts quarterly\n'
                    '• Use Wise (formerly TransferWise) for lower fees on smaller transfers\n'
                    '• Some brokers like Interactive Brokers accept deposits via Wise, reducing costs\n'
                    '• Consider the fee as a percentage of your transfer — aim to keep it under 2%'
                ),
                'category': 'Practical Tips',
                'order': 7,
            },
            {
                'question': 'What happens to my US stocks if my brokerage goes bankrupt?',
                'answer': (
                    'US-regulated brokerages are members of SIPC (Securities Investor Protection Corporation), '
                    'which protects customer securities up to $500,000 (including $250,000 for cash claims). '
                    'Your shares are held in your name, not the brokerage\'s, so they would be transferred to '
                    'another broker. Always ensure your brokerage is SIPC-insured and regulated by the SEC.'
                ),
                'category': 'Security',
                'order': 8,
            },
            {
                'question': 'Should I invest in individual stocks or ETFs as a Kenyan investor?',
                'answer': (
                    'For most Kenyan investors, ETFs are the better starting point because:\n'
                    '• Instant diversification reduces risk\n'
                    '• Lower research burden — you don\'t need to analyze individual companies\n'
                    '• ETFs like VOO have very low fees (0.03%)\n'
                    '• Given the 30% dividend withholding tax, growth-oriented ETFs are more tax-efficient\n\n'
                    'Consider individual stocks only after building a core ETF position and gaining market experience.'
                ),
                'category': 'Strategy',
                'order': 9,
            },
            {
                'question': 'How does inflation in Kenya affect my US stock returns?',
                'answer': (
                    'Kenya\'s inflation rate (averaging 6-8% annually) erodes the purchasing power of KES. '
                    'US stocks, priced in USD, can serve as a hedge against KES inflation. Historically, the S&P 500 '
                    'has returned about 10% annually in USD terms. Combined with KES depreciation, Kenyan investors '
                    'have often seen even higher returns in local currency terms. This makes US investing an effective '
                    'inflation hedge for Kenyan savers.'
                ),
                'category': 'Currency',
                'order': 10,
            },
        ]

        created = 0
        for entry_data in qa_entries:
            _, was_created = QAEntry.objects.get_or_create(
                question=entry_data['question'],
                defaults=entry_data,
            )
            if was_created:
                created += 1
        self.stdout.write(f'Q&A entries: {created} created, {len(qa_entries) - created} already existed')

    def _seed_news(self):
        news_items = [
            {
                'title': 'Global Markets Rally on Strong Tech Earnings',
                'content': (
                    'Major global indices climbed as leading technology companies reported '
                    'better-than-expected earnings, with AI-driven revenue growth leading the charge. '
                    'The S&P 500 and NASDAQ both posted significant gains.'
                ),
                'date_published': '2026-06-23',
                'source': 'Global Finance Wire',
            },
            {
                'title': 'Fed Maintains Rate Guidance, Markets Respond Positively',
                'content': (
                    'The Federal Reserve signaled a steady interest rate path through Q3 2026, '
                    'citing balanced inflation data and resilient labor market conditions. Bond yields '
                    'remained stable as investors absorbed the forward guidance.'
                ),
                'date_published': '2026-06-22',
                'source': 'Reuters',
            },
            {
                'title': 'Emerging Market Currencies Show Resilience Against USD',
                'content': (
                    'Several emerging market currencies, including the Kenyan Shilling, have shown '
                    'stabilization against the US Dollar following updated IMF economic forecasts '
                    'and improved terms of trade for commodity-exporting nations.'
                ),
                'date_published': '2026-06-21',
                'source': 'Business Daily Africa',
            },
        ]

        created = 0
        for news_data in news_items:
            _, was_created = NewsItem.objects.get_or_create(
                title=news_data['title'],
                defaults=news_data,
            )
            if was_created:
                created += 1
        self.stdout.write(f'News items: {created} created, {len(news_items) - created} already existed')

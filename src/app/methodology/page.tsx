import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SCORING_WEIGHTS, PENALTIES } from "@/lib/scoring/weights";

export default function MethodologyPage() {
  const weights = [
    {
      name: "תשואות וביצועים",
      weight: SCORING_WEIGHTS.returns.weight,
      description:
        "ביצועי הקרן כוללים מספר פרמטרים: תשואה ל-5 שנים (25%), תשואה ל-3 שנים (20%), יחס שארפ - מדד לתשואה מותאמת סיכון (20%), אלפא - תשואה עודפת מעל הבנצ'מרק (15%), עקביות בביצועים - סטיית תקן נמוכה יותר מעידה על יציבות (10%), ותשואה מתחילת השנה (10%). משקל מוגבר ניתן ליחס שארפ ולאלפא כיוון שהם מעידים על ניהול השקעות איכותי לאורך זמן.",
    },
    {
      name: "מגבלת דמי ניהול חיצוניים",
      weight: SCORING_WEIGHTS.fees.weight,
      description:
        "מגבלת הוצאות הניהול החיצוניות של כל מסלול כפי שהחברה מדווחת - כולל מגבלת דמי ניהול שנתיים (60%) ודמי ניהול מהפקדה (40%). ככל שהמגבלה נמוכה יותר, כך החוסך נהנה מפחות הוצאות. חשוב: אלו לא דמי הניהול האישיים שמשלם כל עמית (שנקבעים לפי שכר וצבירה).",
    },
    {
      name: "איזון אקטוארי",
      weight: SCORING_WEIGHTS.actuarialBalance.weight,
      description:
        "מדד קריטי לבריאות הקרן. עודף אקטוארי מצביע על יציבות הקרן ומסוגלותה לעמוד בהתחייבויותיה. גירעון אקטוארי עלול להוביל להפחתת תשואות ופגיעה בזכויות החוסכים. גירעון יכול לנבוע מהרכב אוכלוסיית המבוטחים (גיל, שכר, מצב בריאותי).",
    },
    {
      name: "איכות שירות",
      weight: SCORING_WEIGHTS.serviceQuality.weight,
      description:
        "מבוסס על מדד השירות של רשות שוק ההון (2024). המדד כולל זמני מענה, איכות מענה, תלונות ציבור ונגישות שירות. חברות שלא נכללו במדד מקבלות ציון ניטרלי (50).",
    },
    {
      name: "גודל קרן",
      weight: SCORING_WEIGHTS.fundSize.weight,
      description:
        "קרנות גדולות יותר נהנות מיציבות טובה יותר, פיזור סיכונים רחב יותר ויכולת ניהול מתקדמת. הנורמליזציה לוגריתמית - ההבדל בין 500 מיליון ל-5 מיליארד משמעותי יותר מהבדל בין 5 מיליארד ל-50 מיליארד.",
    },
    {
      name: "זרימת כספים",
      weight: SCORING_WEIGHTS.netFlow.weight,
      description:
        "יחס הפקדות נטו לסך הנכסים - מדד ל\"הצבעת רגליים\" של המבוטחים. קרן שמגייסת כספים נחשבת אטרקטיבית יותר, בעוד קרן עם נטישה גבוהה עשויה לסבול מבעיות מובניות. במסלולי מקבלי קצבה, זרימה שלילית היא טבעית (תשלום קצבאות) ולכן ניתן ציון ניטרלי.",
    },
    {
      name: "שיעור אישור תביעות",
      weight: SCORING_WEIGHTS.claimsApproval.weight,
      description:
        "אחוז גבוה של אישור תביעות נכות ושאירים מצביע על קרן שמכבדת את המבוטחים שלה. נתון זה מקבל כרגע ציון ניטרלי - יתעדכן כשיהיה זמין ממקורות מובנים.",
    },
    {
      name: "גמישות מסלולי השקעה",
      weight: SCORING_WEIGHTS.trackFlexibility.weight,
      description:
        "היכולת לפזר בין מספר מסלולי השקעה (לתגמולים ולפיצויים בנפרד) חשובה לניהול סיכונים. חלק מהקרנות מוגבלות למסלול אחד.",
    },
  ];

  const penaltyList = [
    {
      name: "גירעון אקטוארי",
      points: PENALTIES.actuarialDeficit.maxDeduction,
      description: PENALTIES.actuarialDeficit.description,
      detail:
        "מחושב באופן יחסי לחומרת הגירעון. קרן בגירעון אקטוארי משמעותי עלולה להפחית את תשואות החוסכים כדי לכסות את הפער.",
    },
    {
      name: "קבלה ללא הצהרת בריאות",
      points: PENALTIES.noHealthDeclaration.maxDeduction,
      description: PENALTIES.noHealthDeclaration.description,
      detail:
        "קרנות כמו אלטשולר שחם, מיטב, מור ואינפיניטי מקבלות מבוטחים ללא הצהרת בריאות. הדבר עלול ליצור עלייה בתביעות ולפגוע באיזון האקטוארי, שמשפיע על כלל החוסכים בקרן.",
    },
    {
      name: "קרן קטנה מאוד",
      points: PENALTIES.verySmallFund.maxDeduction,
      description: PENALTIES.verySmallFund.description,
      detail: `קרנות עם נכסים מתחת ל-${PENALTIES.verySmallFund.assetThresholdMillions} מיליון ₪ סובלות מחוסר יציבות מובנה - ריכוז סיכונים, עלויות ניהול גבוהות יחסית ויכולת פיזור נמוכה.`,
    },
    {
      name: "מסלול השקעה מוגבל",
      points: PENALTIES.limitedTrackOptions.maxDeduction,
      description: PENALTIES.limitedTrackOptions.description,
      detail:
        "חברות כמו מנורה מבטחים וכלל מאפשרות רק מסלול אחד לתגמולים ואחד לפיצויים, ללא אפשרות לפיזור בין מסלולים שונים.",
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h2 className="text-3xl font-bold mb-2">מתודולוגיה</h2>
      <p className="text-muted-foreground mb-8">
        כיצד מחושב מדד איכות קרנות הפנסיה
      </p>

      {/* Overview */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>סקירה כללית</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm leading-relaxed">
          <p>
            המדד מורכב מציון בסיס משוקלל (0-100) בניכוי הורדות בדירוג על
            חסרונות מובניים. הציון הבסיסי מחושב כסכום משוקלל של תת-ציונים בתחומים
            שונים, כאשר כל תת-ציון מנורמל ביחס לכלל הקרנות בשוק.
          </p>
          <p>
            הנורמליזציה מבוצעת בשיטת דירוג אחוזוני (Percentile Rank) - כל קרן
            מקבלת ציון לפי מיקומה היחסי בין כלל הקרנות בקטגוריה. שיטה זו מבטיחה
            פיזור אחיד של ציונים בין 0 ל-100. לגודל קרן מיושמת נורמליזציה
            לוגריתמית. נתונים חסרים מקבלים ציון ניטרלי (50).
          </p>
          <p>
            לאחר חישוב ציון הבסיס וההורדות, הציון הסופי עובר מתיחה לטווח 35-95
            כדי לייצר פיזור משמעותי ומובן למשתמש.
          </p>
          <p className="font-medium">
            ציון סופי = מתיחה לטווח(ציון בסיס משוקלל - סה״כ הורדות)
          </p>
        </CardContent>
      </Card>

      {/* Category Scoring */}
      <Card className="mb-8 border-primary/20">
        <CardHeader>
          <CardTitle>חישוב לפי קטגוריה</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm leading-relaxed">
          <p>
            <strong>חשוב:</strong> המדד מחלק את קרנות הפנסיה ל-4 קטגוריות
            נפרדות. הדירוג מבוצע בנפרד בכל קטגוריה כיוון שלא ניתן להשוות
            ביניהן.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            <div className="rounded-lg border p-4">
              <div className="font-bold mb-1">מקיפה</div>
              <p className="text-muted-foreground">
                קרנות פנסיה מקיפה חדשות לכלל האוכלוסיה - כוללות ביטוח נכות
                ושאירים, מנגנון אבטחת תשואה (כ-30% מהנכסים) ומקדם המרה לקצבה.
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <div className="font-bold mb-1">כללית/משלימה</div>
              <p className="text-muted-foreground">
                קרנות כלליות ומשלימות לכלל האוכלוסיה. גם בהן קיים מקדם המרה,
                אך הוא גבוה יותר מזה של המקיפה (פחות נוח לחוסך). אין מנגנון
                אבטחת תשואה.
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <div className="font-bold mb-1">מקיפה - מקבלי קצבה</div>
              <p className="text-muted-foreground">
                מסלולי מקיפה המיועדים למי שכבר מקבל קצבה. מנגנון אבטחת התשואה
                גבוה יותר (כ-60% מהנכסים) ופרופיל ההשקעה שמרני יותר.
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <div className="font-bold mb-1">כללית/משלימה - מקבלי קצבה</div>
              <p className="text-muted-foreground">
                מסלולי כללית ומשלימה למקבלי קצבה - מותאמים לצרכי השקעה שונים
                של פנסיונרים עם פרופיל סיכון נמוך יותר.
              </p>
            </div>
          </div>
          <p className="mt-4">
            <strong>זיהוי מסלולי מקבלי קצבה:</strong> מסלולים מזוהים כמסלולי
            מקבלי קצבה על פי שמם - מסלולים שמכילים את המילה &quot;קצבה&quot;
            מסווגים אוטומטית לקטגוריית מקבלי הקצבה המתאימה.
          </p>
          <p className="mt-4">
            <strong>ציון חברה:</strong> ציון חברת הפנסיה מחושב כממוצע משוקלל
            לפי נכסים של כל מסלולי הקרן באותה קטגוריה. הציון הכולל מחושב על
            בסיס מסלולים רגילים (לא כולל מקבלי קצבה). מסלולים גדולים יותר
            משפיעים יותר על ציון החברה.
          </p>
        </CardContent>
      </Card>

      {/* Weights */}
      <h3 className="text-xl font-bold mb-4">משקלות ציון הבסיס</h3>
      <div className="space-y-4 mb-8">
        {weights.map((w) => (
          <Card key={w.name}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-base">{w.name}</h4>
                <span className="text-lg font-bold text-primary">
                  {(w.weight * 100).toFixed(0)}%
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden mb-3">
                <div
                  className="h-full bg-yellow-500 rounded-full"
                  style={{ width: `${w.weight * 100}%` }}
                />
              </div>
              <p className="text-sm text-muted-foreground">{w.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Rating Deductions */}
      <h3 className="text-xl font-bold mb-4">הורדה בדירוג</h3>
      <p className="text-sm text-muted-foreground mb-4">
        גורמים שמורידים את ציון הקרן. לכל גורם יש הסבר מדוע הוא משפיע
        לרעה על החוסכים.
      </p>
      <div className="space-y-4 mb-8">
        {penaltyList.map((p) => (
          <Card key={p.name} className="border-destructive/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-base">{p.name}</h4>
                <span className="text-lg font-bold text-destructive">
                  עד -{p.points} נקודות
                </span>
              </div>
              <p className="text-sm text-muted-foreground mb-2">
                <strong>למה זה מוריד?</strong> {p.description}
              </p>
              <p className="text-sm text-muted-foreground">{p.detail}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Data Sources */}
      <h3 className="text-xl font-bold mb-4">מקורות מידע</h3>
      <Card>
        <CardContent className="pt-6 space-y-3 text-sm">
          <div className="flex justify-between py-2 border-b">
            <span className="text-muted-foreground">תשואות ודמי ניהול</span>
            <span>data.gov.il - פנסיה נט</span>
          </div>
          <div className="flex justify-between py-2 border-b">
            <span className="text-muted-foreground">גודל קרן ונכסים</span>
            <span>data.gov.il - פנסיה נט</span>
          </div>
          <div className="flex justify-between py-2 border-b">
            <span className="text-muted-foreground">איזון אקטוארי</span>
            <span>data.gov.il - עדכון רבעוני</span>
          </div>
          <div className="flex justify-between py-2 border-b">
            <span className="text-muted-foreground">איכות שירות</span>
            <span>מדד השירות 2024 - רשות שוק ההון</span>
          </div>
          <div className="flex justify-between py-2 border-b">
            <span className="text-muted-foreground">מגבלות קרנות</span>
            <span>נתונים ידניים - מתנאי הקרנות</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-muted-foreground">תדירות עדכון</span>
            <span>חודשי (תשואות), רבעוני (אקטוארי)</span>
          </div>
        </CardContent>
      </Card>

      {/* Limitations */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>מגבלות</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>
            חלק מהנתונים (איכות שירות, שיעור אישור תביעות, תלונות ציבור) אינם
            זמינים אוטומטית ממקורות ציבוריים ומקבלים ציון ניטרלי עד שיתעדכנו.
          </p>
          <p>
            המדד אינו מהווה ייעוץ פנסיוני או המלצה. החלטות פנסיוניות צריכות
            להתבסס על ייעוץ מקצועי המותאם לנתוניך האישיים.
          </p>
          <p>
            ביצועי עבר אינם מבטיחים תשואות עתידיות.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

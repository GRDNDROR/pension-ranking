import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <h2 className="text-3xl font-bold mb-2">אודות</h2>
      <p className="text-muted-foreground mb-8">
        על הפרויקט והמטרות שלו
      </p>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>מטרת הפרויקט</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm leading-relaxed">
          <p>
            השוואת קרנות פנסיה בישראל מתמקדת בדרך כלל בדמי ניהול ובתשואות
            קצרות טווח. אך בחירת קרן פנסיה היא החלטה ארוכת טווח שצריכה לקחת
            בחשבון גורמים רבים נוספים.
          </p>
          <p>
            מדד איכות קרנות הפנסיה נוצר כדי לספק תמונה רחבה יותר - מדד מורכב
            שמשלב תשואות, דמי ניהול, יציבות אקטוארית, גודל קרן, גמישות מסלולי
            השקעה ואיכות שירות.
          </p>
          <p>
            המטרה היא לעזור לציבור לקבל החלטות מושכלות יותר לגבי קרן הפנסיה
            שלהם, מעבר לפרמטר הבודד של דמי ניהול.
          </p>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>מקורות מידע</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm leading-relaxed">
          <p>
            הנתונים מגיעים ממקורות ציבוריים של ממשלת ישראל:
          </p>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground">
            <li>
              <strong>data.gov.il</strong> - הפורטל הממשלתי לנתונים
              פתוחים, כולל מאגרי פנסיה נט וגמל נט
            </li>
            <li>
              <strong>רשות שוק ההון, ביטוח וחיסכון</strong> - דוחות
              ומדדים תקופתיים
            </li>
          </ul>
          <p>
            הנתונים מתעדכנים באופן אוטומטי מדי חודש (תשואות ודמי ניהול)
            ורבעון (נתונים אקטואריים).
          </p>
        </CardContent>
      </Card>

      <Card className="border-amber-200">
        <CardHeader>
          <CardTitle>הבהרה חשובה</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm leading-relaxed">
          <p>
            <strong>
              המידע באתר זה הינו אינפורמטיבי בלבד ואינו מהווה ייעוץ פנסיוני,
              ייעוץ השקעות או המלצה מכל סוג.
            </strong>
          </p>
          <p>
            בחירת קרן פנסיה היא החלטה משמעותית שצריכה להתבסס על ייעוץ מקצועי
            המותאם לנתוניך האישיים, מצבך הבריאותי, גילך ויעדי החיסכון שלך.
          </p>
          <p>
            ביצועי עבר אינם מבטיחים תשואות עתידיות. המדד נועד לשמש ככלי עזר
            ראשוני בלבד.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

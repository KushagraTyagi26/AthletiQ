"""Extract real cycling power-vs-blood-lactate observations from the Trinity College Dublin exercise-test archive."""
import argparse,hashlib,io,warnings
from pathlib import Path
from zipfile import ZipFile
import openpyxl,pandas as pd
ROOT=Path(__file__).resolve().parents[1]
OFFICIAL_MD5='f64cb1bf4d66129daed6c1954ea6ca9f'
def prepare(source,out):
 checksum=hashlib.md5(source.read_bytes()).hexdigest()
 if checksum!=OFFICIAL_MD5:raise ValueError(f'Source MD5 mismatch: {checksum}')
 rows=[]
 with ZipFile(source) as z:
  summary=openpyxl.load_workbook(io.BytesIO(z.read('data/Data_Summary.xlsx')),read_only=True,data_only=True).active
  for record in list(summary.values)[1:]:
   if record[3]!='Cycling':continue
   filename,date=record[1],record[7]
   try:
    with warnings.catch_warnings():
     warnings.simplefilter('ignore',UserWarning)
     book=openpyxl.load_workbook(io.BytesIO(z.read('data/'+filename)),read_only=True,data_only=True)
     for r in list(book.worksheets[1].values)[1:]:
      power,_,_,lactate=r[:4]
      if isinstance(power,(int,float)) and isinstance(lactate,(int,float)) and 0<power<=600 and 0<lactate<25:
       rows.append((filename.removesuffix('.xlsx'),date.date().isoformat(),float(power),float(lactate)))
   except (KeyError,ValueError,TypeError,AttributeError):continue
 df=pd.DataFrame(rows,columns=['athlete_id','date','training_load','performance_score'])
 # athlete_id is a TEST ID, not an independently verified unique human identity.
 df.to_csv(out,index=False)
 print(f'MD5 verified {checksum}; {len(df)} measured stages from {df.athlete_id.nunique()} cycling test files; {df.date.nunique()} dates; target blood lactate mmol/L.')
 return df
if __name__=='__main__':
 parser=argparse.ArgumentParser(description=__doc__)
 parser.add_argument('--source',type=Path,default=ROOT/'data/raw/graded_tests.zip')
 parser.add_argument('--out',type=Path,default=ROOT/'data/processed/cycling_lactate.csv')
 a=parser.parse_args();prepare(a.source,a.out)

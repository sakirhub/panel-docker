import { IsNotEmpty, IsNumber, IsObject, IsString } from 'class-validator';

export class CreateHavaleDto {
  @IsNotEmpty({
    message: 'Payment method must not be empty',
    context: { errorCode: 'payment_method' },
  })
  @IsString({
    message: 'Payment method must be a string',
    context: { errorCode: 'payment_method' },
  })
  payment_method: string;
  @IsNumber(
    { allowNaN: false, allowInfinity: false },
    { message: 'Amount must be a number', context: { errorCode: 'amount' } },
  )
  @IsNotEmpty({
    message: 'Amount must not be empty',
    context: { errorCode: 'amount' },
  })
  amount: number;
  @IsNotEmpty({
    message: 'Currency must not be empty',
    context: { errorCode: 'currency' },
  })
  @IsString({
    message: 'Currency must be a string',
    context: { errorCode: 'currency' },
  })
  currency: string;
  @IsNotEmpty({
    message: 'User must not be empty',
    context: { errorCode: 'user' },
  })
  @IsObject({
    message: 'User must be an object',
    context: { errorCode: 'user' },
  })
  user: {
    id: string;
    name: string;
    surname: string;
    username: string;
  };
  @IsNotEmpty({
    message: 'Transaction id must not be empty',
    context: { errorCode: 'transaction_id' },
  })
  @IsString({
    message: 'Transaction id must be a string',
    context: { errorCode: 'transaction_id' },
  })
  transaction_id: string;
  @IsNotEmpty({
    message: 'Success url must not be empty',
    context: { errorCode: 'success_url' },
  })
  @IsString({
    message: 'Success url must be a string',
    context: { errorCode: 'success_url' },
  })
  success_url: string;
  @IsNotEmpty({
    message: 'Fail url must not be empty',
    context: { errorCode: 'fail_url' },
  })
  @IsString({
    message: 'Fail url must be a string',
    context: { errorCode: 'fail_url' },
  })
  fail_url: string;
}
